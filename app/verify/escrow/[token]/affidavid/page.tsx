import { notFound } from 'next/navigation';

async function fetchVerification(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/axpt/public/verify?token=${token}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function EscrowAffidavitPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await fetchVerification(params.token);
  if (!data || !data.ok) notFound();

  const { case: c, verification } = data;

  return (
    <main className="max-w-4xl mx-auto py-20 px-8 text-black bg-white">
      <h1 className="text-2xl font-bold text-center mb-10">
        Procedural Verification Affidavit
      </h1>

      <p className="mb-4">
        I hereby attest that the following case underwent procedural verification
        via the AXPT system.
      </p>

      <ul className="mb-6">
        <li><strong>Case:</strong> {c.title}</li>
        <li><strong>Jurisdiction:</strong> {c.jurisdiction}</li>
        <li><strong>Verification ID:</strong> {verification.verificationId}</li>
        <li><strong>Artifact Hash:</strong> {verification.artifactHash}</li>
        <li><strong>Issued At:</strong> {new Date(verification.issuedAt).toUTCString()}</li>
      </ul>

      {verification.anchored && (
        <>
          <h2 className="font-semibold mt-6">Blockchain Anchor</h2>
          <ul>
            <li>Chain: {verification.anchored.chain}</li>
            <li>Digest: {verification.anchored.digest}</li>
            <li>Transaction: {verification.anchored.txHash}</li>
          </ul>
        </>
      )}

      <p className="mt-10 text-sm text-gray-600">
        AXPT does not custody funds, execute transactions, or act as escrow agent.
        This affidavit records procedural verification only.
      </p>

      <div className="mt-16">
        <p>Signature: __________________________</p>
        <p>Date: __________________________</p>
      </div>
    </main>
  );
}