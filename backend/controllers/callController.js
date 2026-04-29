const pool = require("../config/db");
const { ensureMember } = require("./conversationController");

/** Historique des appels pour une conversation. */
exports.history = async (req, res, next) => {
  try {
    const member = await ensureMember(req.params.id, req.user.id);
    if (!member) return res.status(403).json({ message: "Accès refusé" });

    const [rows] = await pool.query(
      `SELECT c.*, u.display_name AS caller_name, u.avatar_url AS caller_avatar
       FROM calls c
       JOIN users u ON u.id = c.caller_id
       WHERE c.conversation_id = ?
       ORDER BY c.started_at DESC
       LIMIT 50`,
      [req.params.id],
    );
    res.json({ calls: rows });
  } catch (err) { next(err); }
};

/** Crée un enregistrement d'appel (le signaling est géré via socket). */
exports.start = async (req, res, next) => {
  try {
    const { conversation_id, type = "audio" } = req.body;
    const member = await ensureMember(conversation_id, req.user.id);
    if (!member) return res.status(403).json({ message: "Accès refusé" });

    const [r] = await pool.query(
      `INSERT INTO calls (conversation_id, caller_id, type, status) VALUES (?, ?, ?, 'ringing')`,
      [conversation_id, req.user.id, type],
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
};

/** Termine l'appel (rejet, timeout, raccrochage). */
exports.end = async (req, res, next) => {
  try {
    const { status = "ended", duration = 0 } = req.body;
    await pool.query(
      `UPDATE calls SET status = ?, duration = ?, ended_at = NOW() WHERE id = ?`,
      [status, duration, req.params.id],
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};
