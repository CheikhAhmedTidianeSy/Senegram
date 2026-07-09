/**
 * S3-compatible storage service (Cloudflare R2, AWS S3, Supabase, etc.)
 * Configure via environment variables
 */
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// S3 client configuration
function createS3Client() {
  const endpoint = process.env.S3_ENDPOINT; // e.g., https://<account-id>.r2.cloudflarestorage.com
  const region = process.env.S3_REGION || "auto"; // "auto" for R2
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.warn("⚠️ S3 storage not fully configured - using local fallback");
    return null;
  }

  return {
    client: new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
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
  // For R2 public buckets: https://pub-<bucket>.<account-id>.r2.dev/key
  // For private buckets with presigned URLs, use getSignedUrl
  const publicUrl = process.env.S3_PUBLIC_URL; // e.g., https://pub-xxx.r2.dev
  if (publicUrl) return `${publicUrl}/${key}`;
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
      CacheControl: "public, max-age=31536000", // 1 year
    }));

    const url = getPublicUrl(key);
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

module.exports = { uploadToS3, deleteFromS3, getPresignedUrl, getPublicUrl, s3 };