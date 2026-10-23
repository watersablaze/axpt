import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { GsamCustodyStore } from "./gsamWriteOnceCustody";
import { GsamCustodyError } from "./gsamWriteOnceCustody";

type Config = Readonly<{ endpoint: string; region: string; accessKeyId: string; secretAccessKey: string; bucket: string }>;

/** Dedicated GSAM adapter. Does not modify NeonObjectStorage.write(). */
export function createGsamConditionalS3Store(config: Config): GsamCustodyStore {
  const client = new S3Client({
    endpoint: config.endpoint, region: config.region, forcePathStyle: true,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  return {
    async putIfAbsent(key, bytes, contentType) {
      try {
        await client.send(new PutObjectCommand({
          Bucket: config.bucket, Key: key, Body: bytes, ContentType: contentType, IfNoneMatch: "*",
        }));
        return "created";
      } catch (error) {
        const e = error as { $metadata?: { httpStatusCode?: number }; name?: string };
        if (e.$metadata?.httpStatusCode === 412 || e.name === "PreconditionFailed") return "exists";
        // 501/NotImplemented/NotSupported means the provider cannot enforce atomic creation.
        if (e.$metadata?.httpStatusCode === 501 || e.name === "NotImplemented" || e.name === "NotSupported") {
          throw new GsamCustodyError("CONDITIONAL_WRITE_UNSUPPORTED");
        }
        // 409 is not proof of existing immutable content; fail closed.
        throw new GsamCustodyError("WRITE_FAILED");
      }
    },
    async read(key) {
      const result = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
      if (!result.Body) throw new GsamCustodyError("READ_FAILED");
      return new Uint8Array(await result.Body.transformToByteArray());
    },
  };
}
