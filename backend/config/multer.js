const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 50 * 1024 * 1024;

/**
 * Memory storage for S3 uploads
 * Files stay in memory until uploaded to S3/R2
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Videos
      "video/mp4",
      "video/webm",
      "video/quicktime",
      // Audio
      "audio/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/ogg",
      "audio/opus",
      "audio/wav",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}`), false);
    }
  },
});

module.exports = upload;