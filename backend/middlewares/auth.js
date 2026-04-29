const jwt = require("jsonwebtoken");

/**
 * Middleware JWT : vérifie l'entête Authorization: Bearer <token>.
 * Ajoute req.user = { id, username, email } en cas de succès.
 */
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = auth;
