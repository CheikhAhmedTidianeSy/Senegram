const path = require("path");
const fs = require("fs");
const { uploadToS3, s3 } = require("../services/s3");

const AUDIO_MIMES = new Set(["audio/webm", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/opus"]);
const MAX_VOICE_SIZE = 10 * 1024 * 1024;
const MAX_VOICE_DURATION = 5 * 60;

/**
 * Returns file metadata after S3 upload (used in POST /api/messages/conversation/:id as "attachment").
 */
exports.uploadSingle = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });

  const uploadType = req.uploadType || "message";
  let result;

  try {
    // Try S3 first if configured
    if (s3) {
      result = await uploadToS3(req.file, uploadType);
    }
  } catch (err) {
    console.error("[Upload] S3 upload failed, falling back to local:", err);
  }

  // Fallback to local storage if S3 not configured or failed
  if (!result) {
    const sub = uploadType === "avatar" ? "avatars" : 
      req.file.mimetype.startsWith("image/") ? "images" :
      req.file.mimetype.startsWith("video/") ? "videos" :
      req.file.mimetype.startsWith("audio/") ? "audio" : "documents";

    const ext = path.extname(req.file.originalname) || "";
    const safe = `${Date.now()}_${Math.random().toString(36).slice(2, 14)}${ext.toLowerCase()}`;
    const localPath = path.join(__dirname, "..", "uploads", sub, safe);

    // Ensure directory exists
    const dir = path.dirname(localPath);
    if (!require("fs").existsSync(dir)) {
      require("fs").mkdirSync(dir, { recursive: true });
    }

    // Write buffer to disk
    require("fs").writeFileSync(localPath, req.file.buffer);

    const relative = path
      .relative(path.join(__dirname, ".."), localPath)
      .replace(/\\/g, "/");
    result = { url: `/${relative}`, key: null };
  }

  res.status(201).json({
    file: {
      url: result.url,
      key: result.key,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
    },
  });
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });

  let result;
  try {
    if (s3) {
      result = await uploadToS3(req.file, "avatar");
    }
  } catch (err) {
    console.error("[Upload] Avatar S3 upload failed, falling back to local:", err);
  }

  if (!result) {
    const ext = path.extname(req.file.originalname) || "";
    const safe = `${Date.now()}_${Math.random().toString(36).slice(2, 14)}${ext.toLowerCase()}`;
    const localPath = path.join(__dirname, "..", "uploads", "avatars", safe);

    const dir = path.dirname(localPath);
    if (!require("fs").existsSync(dir)) {
      require("fs").mkdirSync(dir, { recursive: true });
    }

    require("fs").writeFileSync(localPath, req.file.buffer);
    const relative = path
      .relative(path.join(__dirname, ".."), localPath)
      .replace(/\\/g, "/");
    result = { url: `/${relative}`, key: null };
  }

  res.status(201).json({ avatar_url: result.url });
};

exports.uploadVoice = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier audio reçu" });

  const duration = Number(req.body.duration || 0);

  if (!AUDIO_MIMES.has(req.file.mimetype)) {
    return res.status(400).json({ message: "Format audio non supporté" });
  }
  if (req.file.size > MAX_VOICE_SIZE) {
    return res.status(400).json({ message: "Note vocale trop lourde (max 10 MB)" });
  }
  if (!duration || duration > MAX_VOICE_DURATION) {
    return res.status(400).json({ message: "Durée audio invalide ou supérieure à 5 minutes" });
  }

  let result;
  try {
    if (s3) {
      result = await uploadToS3(req.file, "voice");
    }
  } catch (err) {
    console.error("[Upload] Voice S3 upload failed, falling back to local:", err);
  }

  if (!result) {
    const ext = path.extname(req.file.originalname) || ".webm";
    const safe = `${Date.now()}_${Math.random().toString(36).slice(2, 14)}${ext.toLowerCase()}`;
    const localPath = path.join(__dirname, "..", "uploads", "audio", safe);

    const dir = path.dirname(localPath);
    if (!require("fs").existsSync(dir)) {
      require("fs").mkdirSync(dir, { recursive: true });
    }

    require("fs").writeFileSync(localPath, req.file.buffer);
    const relative = path
      .relative(path.join(__dirname, ".."), localPath)
      .replace(/\\/g, "/");
    result = { url: `/${relative}`, key: null };
  }

  res.status(201).json({
    file: {
      url: result.url,
      key: result.key,
      file_name: req.file.originalname || "note-vocale.webm",
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      duration: Math.round(duration * 1000),
    },
  });
};