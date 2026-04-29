const path = require("path");

/**
 * Retourne les métadonnées du fichier uploadé (utilisées ensuite dans un
 * POST /api/messages/conversation/:id comme "attachment").
 */
exports.uploadSingle = (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
  const relative = path
    .relative(path.join(__dirname, ".."), req.file.path)
    .replace(/\\/g, "/");
  res.status(201).json({
    file: {
      url:       `/${relative}`,                      // → /uploads/<type>/<filename>
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
    },
  });
};

exports.uploadAvatar = (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
  const relative = path
    .relative(path.join(__dirname, ".."), req.file.path)
    .replace(/\\/g, "/");
  res.status(201).json({ avatar_url: `/${relative}` });
};
