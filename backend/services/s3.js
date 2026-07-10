/**
 * S3-compatible storage service (Backblaze B2, Cloudflare R2, AWS S3, etc.).
 * Configure via S3_* variables. BACKBLAZE_/B2_* aliases are supported too.
 */
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

function env(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return "";
}

function stripTrailingSlash(value) {
  return value ? value.replace(/\/+$/, "") : "";
}

// S3 client configuration
function createS3Client() {
  const endpoint = env("S3_ENDPOINT", "B2_ENDPOINT", "BACKBLAZE_ENDPOINT");
  const region = env("S3_REGION", "B2_REGION", "BACKBLAZE_REGION") || "auto";
  const accessKeyId = env("S3_ACCESS_KEY_ID", "B2_KEY_ID", "BACKBLAZE_KEY_ID");
  const secretAccessKey = env("S3_SECRET_ACCESS_KEY", "B2_APPLICATION_KEY", "BACKBLAZE_APPLICATION_KEY");
  const bucket = env("S3_BUCKET", "B2_BUCKET", "BACKBLAZE_BUCKET");

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.warn("⚠️ Stockage S3/Backblaze incomplet");
    return null;
  }

  return {
    client: new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
    bucket,
    endpoint: stripTrailingSlash(endpoint),
    region,
    publicUrl: stripTrailingSlash(env("S3_PUBLIC_URL", "B2_PUBLIC_URL", "BACKBLAZE_PUBLIC_URL")),
  };
}

const s3 = createS3Client();

function pickFolder(mimetype, uploadType) {
  if (uploadType === "avatar") return "avatars";
  if (mimetype.startsWith("image/")) return "images";
  if (mimetype.startsWith("video/")) return "videos";
  if (mimetype.startsWith("audio/")) return "audio";
  return "documents";
}

function getPublicUrl(key) {
  if (!s3) return null;
  if (s3.publicUrl) return `${s3.publicUrl}/${key}`;
  if (s3.endpoint && s3.bucket) return `${s3.endpoint}/${s3.bucket}/${key}`;
  return null;
}

async function uploadToS3(file, uploadType = "message") {
  if (!s3) return null; // fallback to local

  const folder = pickFolder(file.mimetype, uploadType);
  const ext = path.extname(file.originalname) || "";
  const safeName = `${Date.now()}_${uuidv4().replace(/-/g, "").slice(0, 12)}${ext.toLowerCase()}`;
  const key = `${folder}/${safeName}`;

  try {
    await s3.client.send(new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
      CacheControl: "public, max-age=31536000", // 1 year
    }));

    const url = getPublicUrl(key);
    if (!url) {
      throw new Error("URL publique du stockage introuvable. Configure S3_PUBLIC_URL ou B2_PUBLIC_URL.");
    }
    return { key, url, bucket: s3.bucket };
  } catch (err) {
    console.error("[S3] Upload error:", err);
    throw err;
  }
}

async function deleteFromS3(key) {
  if (!s3) return false;
  try {
    await s3.client.send(new DeleteObjectCommand({
      Bucket: s3.bucket,
      Key: key,
    }));
    return true;
  } catch (err) {
    console.error("[S3] Delete error:", err);
    return false;
  }
}

async function getPresignedUrl(key, expiresIn = 3600) {
  if (!s3) return null;
  try {
    const command = new GetObjectCommand({ Bucket: s3.bucket, Key: key });
    return await getSignedUrl(s3.client, command, { expiresIn });
  } catch (err) {
    console.error("[S3] Presigned URL error:", err);
    return null;
  }
}

async function checkStorage() {
  if (!s3) {
    return {
      ok: false,
      configured: false,
      message: "Stockage S3/Backblaze non configuré",
    };
  }

  try {
    await s3.client.send(new HeadBucketCommand({ Bucket: s3.bucket }));
    return {
      ok: true,
      configured: true,
      bucket: s3.bucket,
      endpoint: s3.endpoint,
      region: s3.region,
      publicUrl: s3.publicUrl || getPublicUrl("test"),
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      bucket: s3.bucket,
      endpoint: s3.endpoint,
      region: s3.region,
      publicUrl: s3.publicUrl || null,
      error: err.name || err.code || "StorageError",
      statusCode: err.$metadata?.httpStatusCode || null,
      message: err.message,
    };
  }
}

module.exports = { uploadToS3, deleteFromS3, getPresignedUrl, getPublicUrl, checkStorage, s3 };
