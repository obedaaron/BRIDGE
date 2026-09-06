import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function config() {
  const bucket = process.env.S3_PRIVATE_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) return null;
  return { bucket, client: new S3Client({ region }) };
}

export async function storePrivateDocument(key: string, body: Buffer, contentType: string) {
  const storage = config();
  if (!storage) throw new Error("Private document storage is not configured");
  await storage.client.send(new PutObjectCommand({ Bucket: storage.bucket, Key: key, Body: body, ContentType: contentType, ServerSideEncryption: "AES256" }));
}

export async function readPrivateDocument(key: string) {
  const storage = config();
  if (!storage) throw new Error("Private document storage is not configured");
  return storage.client.send(new GetObjectCommand({ Bucket: storage.bucket, Key: key }));
}
