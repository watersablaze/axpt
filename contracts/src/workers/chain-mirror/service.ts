import { ethers } from 'ethers';
import { prisma } from '@/lib/prisma';
import { ENV } from './env';
import { MIRROR_BRIDGE_ABI } from './abi';
import { log } from './logger';

type Job = {
  id: string;
  idempotencyKey: string;
  walletEventId: string;
  tokenType: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  status: string;
  attemptCount: number;
  txHash: string | null;
  claimedBy: string | null;
  claimedAt: Date | null;
  nextAttemptAt: Date | null;
  submittedAt: Date | null;
  minedAt: Date | null;
  blockNumber: number | null;
  confirmations: number;
};

function now() {
  return new Date();
}

function backoffMs(attempt: number) {
  // exponential with cap: 2^attempt seconds, capped at 10 minutes
  const seconds = Math.min(600, Math.pow(2, Math.min(10, attempt)));
  // add jitter
  const jitter = Math.floor(Math.random() * 1000);
  return seconds * 1000 + jitter;
}

async function assertNetwork(provider: ethers.JsonRpcProvider) {
  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);
  if (chainId !== ENV.CHAIN_ID) {
    throw new Error(`Wrong chainId: got ${chainId}, expected ${ENV.CHAIN_ID}`);
  }
}

export class ChainMirrorService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private bridge: ethers.Contract;
  private running = false;
  private tickInFlight = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(ENV.RPC_URL);
    this.signer = new ethers.Wallet(ENV.TREASURY_PRIVATE_KEY, this.provider);
    this.bridge = new ethers.Contract(ENV.MIRROR_BRIDGE_ADDRESS, MIRROR_BRIDGE_ABI, this.signer);
  }

  async init() {
    await assertNetwork(this.provider);

    const owner = (await this.bridge.owner()) as string;
    const signerAddr = await this.signer.getAddress();
    if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
      log('warn', 'Treasury signer is not contract owner (mirrorTransfer will revert)', {
        owner,
        signerAddr,
      });
    } else {
      log('info', 'ChainMirror init OK', { owner, signerAddr });
    }
  }

  async start() {
    await this.init();
    this.running = true;
    log('info', 'ChainMirrorService started', { workerId: ENV.WORKER_ID });

    // eslint-disable-next-line no-constant-condition
    while (this.running) {
      try {
        await this.tick();
      } catch (e: any) {
        log('error', 'Tick error', { err: e?.message || String(e) });
      }
      await new Promise((r) => setTimeout(r, ENV.POLL_MS));
    }
  }

  stop() {
    this.running = false;
  }

  private async tick() {
    // Prevent overlapping ticks (important if tick takes longer than poll interval)
    if (this.tickInFlight) return;
    this.tickInFlight = true;
    try {
      await this.reclaimExpiredClaims();
      const jobs = await this.claimBatch();
      if (jobs.length === 0) return;

      for (const job of jobs) {
        await this.processJob(job);
      }

      // After sending new txs, also advance confirmations for in-flight ones.
      await this.advanceConfirmations();
    } finally {
      this.tickInFlight = false;
    }
  }

  private async reclaimExpiredClaims() {
    const ttlAgo = new Date(Date.now() - ENV.CLAIM_TTL_MS);

    const reclaimed = await prisma.chainMirrorJob.updateMany({
      where: {
        status: 'CLAIMED',
        claimedAt: { lt: ttlAgo },
      },
      data: {
        status: 'RETRY',
        claimedBy: null,
        claimedAt: null,
        lastError: 'CLAIM_TTL_EXPIRED',
        nextAttemptAt: now(),
      },
    });

    if (reclaimed.count > 0) {
      log('warn', 'Reclaimed expired claims', { count: reclaimed.count });
    }
  }

  private async claimBatch(): Promise<Job[]> {
    // Find eligible jobs
    const eligible = await prisma.chainMirrorJob.findMany({
      where: {
        status: { in: ['PENDING', 'RETRY'] },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now() } }],
        attemptCount: { lt: ENV.MAX_ATTEMPTS },
      },
      take: ENV.BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });

    if (eligible.length === 0) return [];

    // Claim each job with optimistic lock update
    const claimed: Job[] = [];
    for (const j of eligible) {
      const updated = await prisma.chainMirrorJob.updateMany({
        where: {
          id: j.id,
          status: j.status,
          lockVersion: j.lockVersion, // ensures only one worker claims it
        },
        data: {
          status: 'CLAIMED',
          claimedBy: ENV.WORKER_ID,
          claimedAt: now(),
          lockVersion: { increment: 1 },
        },
      });

      if (updated.count === 1) {
        claimed.push(j as any);
      }
    }

    if (claimed.length > 0) {
      log('info', 'Claimed jobs', { count: claimed.length });
    }
    return claimed;
  }

  private async processJob(job: Job) {
    // Always re-read fresh row (another step may have advanced it)
    const fresh = await prisma.chainMirrorJob.findUnique({ where: { id: job.id } });
    if (!fresh) return;

    // If already has txHash, focus on confirmation path
    if (fresh.txHash) {
      await prisma.chainMirrorJob.update({
        where: { id: fresh.id },
        data: { status: 'CONFIRMING' },
      });
      return;
    }

    // Defensive: check contract consumed mapping before sending (idempotency baseline)
    const idKey = fresh.idempotencyKey as `0x${string}`;
    const already = (await this.bridge.consumed(idKey)) as boolean;
    if (already) {
      log('warn', 'Job idempotency already consumed on-chain; marking CONFIRMED', {
        jobId: fresh.id,
        idempotencyKey: fresh.idempotencyKey,
      });

      await prisma.chainMirrorJob.update({
        where: { id: fresh.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: now(),
          claimedBy: null,
          claimedAt: null,
          mirrorAddress: ENV.MIRROR_BRIDGE_ADDRESS,
          chainId: ENV.CHAIN_ID,
        },
      });
      return;
    }

    // Submit tx
    try {
      const tx = await this.bridge.mirrorTransfer(
        fresh.idempotencyKey,
        fresh.walletEventId,
        fresh.tokenType,
        fresh.fromAddress,
        fresh.toAddress,
        BigInt(fresh.amount)
      );

      log('info', 'Submitted mirrorTransfer', { jobId: fresh.id, txHash: tx.hash });

      await prisma.chainMirrorJob.update({
        where: { id: fresh.id },
        data: {
          status: 'SUBMITTED',
          txHash: tx.hash,
          submittedAt: now(),
          mirrorAddress: ENV.MIRROR_BRIDGE_ADDRESS,
          chainId: ENV.CHAIN_ID,
          attemptCount: { increment: 1 },
          claimedBy: null,
          claimedAt: null,
          lastError: null,
        },
      });
    } catch (e: any) {
      const attemptCount = fresh.attemptCount + 1;
      const delay = backoffMs(attemptCount);
      const nextAttemptAt = new Date(Date.now() + delay);

      log('warn', 'Submit failed; scheduling retry', {
        jobId: fresh.id,
        attemptCount,
        nextAttemptAt: nextAttemptAt.toISOString(),
        err: e?.shortMessage || e?.message || String(e),
      });

      const isDead = attemptCount >= ENV.MAX_ATTEMPTS;

      await prisma.chainMirrorJob.update({
        where: { id: fresh.id },
        data: {
          status: isDead ? 'DEAD' : 'RETRY',
          attemptCount,
          lastError: e?.shortMessage || e?.message || String(e),
          nextAttemptAt,
          claimedBy: null,
          claimedAt: null,
        },
      });
    }
  }

  private async advanceConfirmations() {
    const inflight = await prisma.chainMirrorJob.findMany({
      where: {
        status: { in: ['SUBMITTED', 'CONFIRMING'] },
        txHash: { not: null },
      },
      take: 50,
      orderBy: { submittedAt: 'asc' },
    });

    if (inflight.length === 0) return;

    const latest = await this.provider.getBlockNumber();

    for (const j of inflight) {
      const txHash = j.txHash!;
      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);

        if (!receipt) {
          // Not mined yet; keep waiting
          await prisma.chainMirrorJob.update({
            where: { id: j.id },
            data: { status: 'CONFIRMING' },
          });
          continue;
        }

        const confs = Math.max(0, latest - receipt.blockNumber + 1);

        // Save mined data
        await prisma.chainMirrorJob.update({
          where: { id: j.id },
          data: {
            status: 'CONFIRMING',
            minedAt: j.minedAt ?? now(),
            blockNumber: receipt.blockNumber,
            confirmations: confs,
          },
        });

        if (receipt.status !== 1n) {
          // Reverted on-chain. Mark FAILED (or RETRY if you want resubmission logic).
          log('error', 'Tx reverted; marking FAILED', { jobId: j.id, txHash });

          await prisma.chainMirrorJob.update({
            where: { id: j.id },
            data: {
              status: 'FAILED',
              lastError: 'TX_REVERTED',
              confirmedAt: now(),
            },
          });
          continue;
        }

        if (confs >= ENV.MIN_CONFIRMATIONS) {
          log('info', 'Job confirmed', { jobId: j.id, txHash, confirmations: confs });

          await prisma.chainMirrorJob.update({
            where: { id: j.id },
            data: {
              status: 'CONFIRMED',
              confirmedAt: now(),
              confirmations: confs,
            },
          });
        }
      } catch (e: any) {
        log('warn', 'Confirmation check error', {
          jobId: j.id,
          txHash,
          err: e?.message || String(e),
        });
      }
    }
  }
}