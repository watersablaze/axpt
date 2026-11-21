import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import type {
  ExternalEvidenceStore,
} from "./preserveExternalIntakeEvidence";

export type ExternalIntakeS3Config = Readonly<{
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}>;

export type ExternalIntakeS3Sender = (
  command: GetObjectCommand | PutObjectCommand,
) => Promise<unknown>;

export class ExternalIntakeS3Error extends Error {
  constructor(
    readonly reason:
      | "CONFIG_INVALID"
      | "CONDITIONAL_WRITE_UNSUPPORTED"
      | "WRITE_FAILED"
      | "READ_FAILED",
  ) {
    super(`FW_TXN_S3_${reason}`);
    this.name = "ExternalIntakeS3Error";
  }
}

function status(error: unknown) {
  if (!error || typeof error !== "object") return null;

  const metadata = (
    error as { $metadata?: { httpStatusCode?: number } }
  ).$metadata;

  return metadata?.httpStatusCode ?? null;
}

function errorName(error: unknown) {
  if (!error || typeof error !== "object") return null;

  return (error as { name?: string }).name ?? null;
}

function validate(config: ExternalIntakeS3Config) {
  if (
    !config.endpoint?.startsWith("https://") ||
    !config.region?.trim() ||
    !config.accessKeyId?.trim() ||
    !config.secretAccessKey?.trim() ||
    !config.bucket?.trim()
  ) {
    throw new ExternalIntakeS3Error("CONFIG_INVALID");
  }
}

/**
 * The sender parameter permits deterministic transport testing.
 * Production callers omit it and use the AWS S3 SDK.
 */
export function createExternalIntakeConditionalS3Store(
  config: ExternalIntakeS3Config,
  sender?: ExternalIntakeS3Sender,
): ExternalEvidenceStore {
  validate(config);

  const client = sender
    ? null
    : new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: true,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });

  const send: ExternalIntakeS3Sender =
    sender ??
    (async (command) => {
      if (!client) {
        throw new ExternalIntakeS3Error("CONFIG_INVALID");
      }

      if (command instanceof PutObjectCommand) {
        return client.send(command);
      }

      return client.send(command);
    });

  return {
    async putIfAbsent(key, bytes, contentType) {
      try {
        await send(
          new PutObjectCommand({
            Bucket: config.bucket,
            Key: key,
            Body: bytes,
            ContentType: contentType,
            IfNoneMatch: "*",
          }),
        );

        return "created";
      } catch (error) {
        const httpStatus = status(error);
        const name = errorName(error);

        if (
          httpStatus === 412 ||
          name === "PreconditionFailed"
        ) {
          return "exists";
        }

        if (
          httpStatus === 501 ||
          name === "NotImplemented" ||
          name === "NotSupported"
        ) {
          throw new ExternalIntakeS3Error(
            "CONDITIONAL_WRITE_UNSUPPORTED",
          );
        }

        // 409 and all other failures are not proof that
        // an immutable object already exists.
        throw new ExternalIntakeS3Error("WRITE_FAILED");
      }
    },

    async read(key) {
      try {
        const result = await send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }),
        );

        const body = (
          result as {
            Body?: {
              transformToByteArray?: () => Promise<Uint8Array>;
            };
          } | null
        )?.Body;

        if (!body?.transformToByteArray) {
          throw new Error("OBJECT_BODY_MISSING");
        }

        return new Uint8Array(
          await body.transformToByteArray(),
        );
      } catch {
        throw new ExternalIntakeS3Error("READ_FAILED");
      }
    },
  };
}
