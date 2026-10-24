import { createHash } from "node:crypto";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { executeGsamEdition2Custody } from "./gsamEdition2CustodyExecutor.mjs";

if (process.env.GSAM_APPROVE_CUSTODY !== "PRESERVE GSAM EDITION 2")
  throw new Error("EXPLICIT_CUSTODY_CONFIRMATION_REQUIRED");
const directory = process.env.GSAM_STAGE;
if (!directory) throw new Error("GSAM_STAGE_REQUIRED");

const required = ["AWS_ENDPOINT_URL_S3","AWS_REGION","AWS_ACCESS_KEY_ID","AWS_SECRET_ACCESS_KEY","AXPT_TRANSACTION_DOCUMENT_BUCKET"];
for (const key of required) if (!process.env[key]?.trim()) throw new Error(`MISSING_STORAGE_CONFIG:${key}`);

const endpoint = process.env.AWS_ENDPOINT_URL_S3.trim().replace(/\\/$/, "");
if (endpoint !== "https://br-falling-fog-aech88q1.storage.c-2.us-east-2.aws.neon.tech")
  throw new Error("PRODUCTION_STORAGE_ENDPOINT_MISMATCH");
if (process.env.AXPT_TRANSACTION_DOCUMENT_BUCKET !== "axpt-transaction-documents")
  throw new Error("PRODUCTION_BUCKET_MISMATCH");
if (process.env.AWS_REGION !== "us-east-2")
  throw new Error("PRODUCTION_REGION_MISMATCH");

const client = new S3Client({
  endpoint,
  region: process.env.AWS_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.AXPT_TRANSACTION_DOCUMENT_BUCKET;
const digest = bytes => createHash("sha256").update(bytes).digest("hex");

const receipt = await executeGsamEdition2Custody({
  directory,
  preserve: async ({format,expectedSha256,bytes}) => {
    const key = `gsam/sco/sha256/${expectedSha256}.${format}`;
    const contentType = format === "pdf" ? "application/pdf" : "text/html; charset=utf-8";
    let disposition = "created";
    try {
      await client.send(new PutObjectCommand({
        Bucket: bucket, Key: key, Body: bytes, ContentType: contentType, IfNoneMatch: "*",
      }));
    } catch (e) {
      if (e?.$metadata?.httpStatusCode === 412 || e?.name === "PreconditionFailed") {
        disposition = "exists";
      } else {
        throw new Error(`CONDITIONAL_WRITE_FAILED:${e?.name ?? "unknown"}:${e?.$metadata?.httpStatusCode ?? "no_status"}`);
      }
    }
    const response = await client.send(new GetObjectCommand({Bucket: bucket,Key: key}));
    if (!response.Body) throw new Error("READBACK_BODY_MISSING");
    const stored = new Uint8Array(await response.Body.transformToByteArray());
    if (digest(stored) !== expectedSha256 || stored.length !== bytes.length)
      throw new Error("READBACK_HASH_OR_SIZE_MISMATCH");
    return {key,sha256:expectedSha256,disposition};
  },
});

console.log(JSON.stringify({
  schema: receipt.schema,
  status: receipt.status,
  artifacts: receipt.artifacts.map(({quantityMt,format,sha256,storageKey,disposition,readbackVerifiedByAdapter}) =>
    ({quantityMt,format,sha256,storageKey,disposition,readbackVerifiedByAdapter})),
  registryMutated: false,
  recipientGrantsMutated: false,
  emailSent: false,
  error: receipt.error ?? null,
}, null, 2));
if (receipt.status !== "PRESERVATION_ADAPTER_ACCEPTED") process.exitCode = 1;
