/**
 * Configuration Multer.
 * - Chaque type de fichier (image/video/audio/document/avatar) va dans son
 *   propre dossier ./uploads/<type>/
 * - Un nom unique (timestamp + random) est généré pour éviter les collisions.
 */
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const BASE_DIR = path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads");

// S'assure que les sous-dossiers existent
["images", "videos", "audio", "documents", "avatars"].forEach((sub) => {
  const p = path.join(BASE_DIR, sub);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

function pickSubfolder(mimetype) {
  if (mimetype.startsWith("image/")) return "images";
  if (mimetype.startsWith("video/")) return "videos";
  if (mimetype.startsWith("audio/")) return "audio";
  return "documents";
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.uploadType === "avatar" ? "avatars" : pickSubfolder(file.mimetype);
    cb(null, path.join(BASE_DIR, sub));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const safe = uuidv4().replace(/-/g, "").slice(0, 12);
    cb(null, `${Date.now()}_${safe}${ext.toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE) || 50 * 1024 * 1024 },
});

module.exports = upload;
