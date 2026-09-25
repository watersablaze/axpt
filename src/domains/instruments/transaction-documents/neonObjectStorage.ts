import "server-only";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

type StorageConfig = Readonly<{
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}>;

export function loadNeonObjectStorageConfig(): StorageConfig | null {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3?.trim();
  const region = process.env.AWS_REGION?.trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.AXPT_TRANSACTION_DOCUMENT_BUCKET?.trim();

  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return {
    endpoint: endpoint.replace(/\/$/, ""),
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

export class NeonObjectStorageError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: string | null = null,
  ) {
    super(message);
  }
}

function statusFrom(error: unknown) {
  if (error instanceof S3ServiceException) {
    return error.$metadata.httpStatusCode ?? null;
  }

  return null;
}

function codeFrom(error: unknown) {
  if (error instanceof S3ServiceException) {
    return error.name ?? null;
  }

  return null;
}

export class NeonObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly config: StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async read(key: string) {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );

      if (!response.Body) {
        throw new NeonObjectStorageError(
          "Neon Object Storage GET returned no object body",
          response.$metadata.httpStatusCode ?? null,
        );
      }

      return new Uint8Array(await response.Body.transformToByteArray());
    } catch (error) {
      if (error instanceof NeonObjectStorageError) {
        throw error;
      }

      const status = statusFrom(error);
      const code = codeFrom(error);

      throw new NeonObjectStorageError(
        `Neon Object Storage GET failed${status ? ` with HTTP ${status}` : ""}${code ? ` (${code})` : ""}`,
        status,
        code,
      );
    }
  }

  async readIfExists(key: string) {
    try {
      return await this.read(key);
    } catch (error) {
      if (
        error instanceof NeonObjectStorageError &&
        (
          error.status === 403 ||
          error.status === 404 ||
          error.code === "NoSuchKey" ||
          error.code === "NotFound"
        )
      ) {
        // Some private S3-compatible stores answer 403 for an existence probe
        // when the object is absent and the credential cannot list the bucket.
        // Real object reads and all writes still fail closed.
        return null;
      }

      throw error;
    }
  }

  async write(
    key: string,
    bytes: Uint8Array,
    contentType = "application/octet-stream",
  ) {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: bytes,
          ContentType: contentType,
        }),
      );
    } catch (error) {
      const status = statusFrom(error);
      const code = codeFrom(error);

      throw new NeonObjectStorageError(
        `Neon Object Storage PUT failed${status ? ` with HTTP ${status}` : ""}${code ? ` (${code})` : ""}`,
        status,
        code,
      );
    }
  }
}

export function createNeonObjectStorage() {
  const config = loadNeonObjectStorageConfig();

  return config ? new NeonObjectStorage(config) : null;
}
