import "server-only";

import { createHash, createHmac } from "node:crypto";

function sha256Hex(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Uint8Array | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function canonicalObjectPath(bucket: string, key: string) {
  const encodedBucket = awsEncode(bucket);
  const encodedKey = key
    .split("/")
    .map((segment) => awsEncode(segment))
    .join("/");

  return `/${encodedBucket}/${encodedKey}`;
}

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
    readonly status: number,
  ) {
    super(message);
  }
}

export class NeonObjectStorage {
  constructor(private readonly config: StorageConfig) {}

  private async request(
    method: "GET" | "PUT",
    key: string,
    body?: Uint8Array,
    contentType?: string,
  ) {
    const endpoint = new URL(this.config.endpoint);
    const path = canonicalObjectPath(this.config.bucket, key);
    const url = new URL(path, endpoint.origin);
    const payload = body ?? new Uint8Array();
    const payloadHash = sha256Hex(payload);

    const now = new Date();
    const amzDate = now
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);

    const canonicalHeaders =
      `host:${url.host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = [
      method,
      path,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope =
      `${dateStamp}/${this.config.region}/s3/aws4_request`;

    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const kDate = hmac(`AWS4${this.config.secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, this.config.region);
    const kService = hmac(kRegion, "s3");
    const kSigning = hmac(kService, "aws4_request");
    const signature = createHmac("sha256", kSigning)
      .update(stringToSign)
      .digest("hex");

    const authorization =
      "AWS4-HMAC-SHA256 " +
      `Credential=${this.config.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      ...(method === "PUT"
        ? { body: Buffer.from(payload) as unknown as BodyInit }
        : {}),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new NeonObjectStorageError(
        `Neon Object Storage ${method} failed with HTTP ${response.status}`,
        response.status,
      );
    }

    return response;
  }

  async read(key: string) {
    const response = await this.request("GET", key);
    return new Uint8Array(await response.arrayBuffer());
  }

  async readIfExists(key: string) {
    try {
      return await this.read(key);
    } catch (error) {
      if (error instanceof NeonObjectStorageError && error.status === 404) {
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
    await this.request("PUT", key, bytes, contentType);
  }
}

export function createNeonObjectStorage() {
  const config = loadNeonObjectStorageConfig();

  return config ? new NeonObjectStorage(config) : null;
}
