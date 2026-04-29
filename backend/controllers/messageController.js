const pool = require("../config/db");
const { ensureMember } = require("./conversationController");

/**
 * Construit la représentation complète d'un message :
 *   - attachments
 *   - sender (extrait)
 */
async function hydrateMessage(msgId) {
  const [[msg]] = await pool.query(
    `SELECT m.*,
            u.username AS sender_username,
            u.display_name AS sender_name,
            u.avatar_url AS sender_avatar
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.id = ?`,
    [msgId],
  );
  if (!msg) return null;
  const [attachments] = await pool.query(
    `SELECT id, url, file_name, file_size, mime_type, duration, width, height
     FROM attachments WHERE message_id = ?`,
    [msgId],
  );
  return { ...msg, attachments };
}

exports.list = async (req, res, next) => {
  try {
    const convId = req.params.id;
    const member = await ensureMember(convId, req.user.id);
    if (!member) return res.status(403).json({ message: "Accès refusé" });

    const before = req.query.before ? Number(req.query.before) : null;
    const limit = Math.min(Number(req.query.limit) || 40, 100);

    const [rows] = await pool.query(
      `SELECT m.*,
              u.username AS sender_username,
              u.display_name AS sender_name,
              u.avatar_url AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
         ${before ? "AND m.id < ?" : ""}
       ORDER BY m.id DESC
       LIMIT ?`,
      before ? [convId, before, limit] : [convId, limit],
    );

    // Attachments en batch
    const ids = rows.map((r) => r.id);
    let attByMsg = {};
    if (ids.length) {
      const [atts] = await pool.query(
        `SELECT * FROM attachments WHERE message_id IN (?)`,
        [ids],
      );
      attByMsg = atts.reduce((acc, a) => {
        (acc[a.message_id] = acc[a.message_id] || []).push(a);
        return acc;
      }, {});
    }
    const messages = rows
      .map((m) => ({ ...m, attachments: attByMsg[m.id] || [] }))
      .reverse(); // renvoie dans l'ordre chronologique

    res.json({ messages });
  } catch (err) { next(err); }
};

exports.send = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const convId = req.params.id;
    const member = await ensureMember(convId, req.user.id);
    if (!member) return res.status(403).json({ message: "Accès refusé" });

    const {
      content = null,
      type = "text",
      reply_to_id = null,
      attachments = [],
    } = req.body;

    if ((!content || !content.trim()) && (!attachments || !attachments.length)) {
      return res.status(400).json({ message: "Message vide" });
    }

    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO messages (conversation_id, sender_id, content, type, reply_to_id)
       VALUES (?, ?, ?, ?, ?)`,
      [convId, req.user.id, content, type, reply_to_id],
    );
    const msgId = r.insertId;

    if (Array.isArray(attachments) && attachments.length) {
      const rows = attachments.map((a) => [
        msgId,
        a.url,
        a.file_name || "fichier",
        a.file_size || 0,
        a.mime_type || "application/octet-stream",
        a.duration || null,
        a.width    || null,
        a.height   || null,
      ]);
      await conn.query(
        `INSERT INTO attachments
           (message_id, url, file_name, file_size, mime_type, duration, width, height)
         VALUES ?`,
        [rows],
      );
    }

    await conn.query(`UPDATE conversations SET updated_at = NOW() WHERE id = ?`, [convId]);
    await conn.commit();

    const full = await hydrateMessage(msgId);

    // Broadcast via socket.io
    const io = req.app.get("io");
    io.to(`conv:${convId}`).emit("message:new", full);

    res.status(201).json({ message: full });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[msg]] = await pool.query(`SELECT * FROM messages WHERE id = ?`, [id]);
    if (!msg) return res.status(404).json({ message: "Message introuvable" });
    if (msg.sender_id !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }
    await pool.query(
      `UPDATE messages SET is_deleted = 1, content = NULL WHERE id = ?`,
      [id],
    );
    const io = req.app.get("io");
    io.to(`conv:${msg.conversation_id}`).emit("message:deleted", {
      id: Number(id),
      conversation_id: msg.conversation_id,
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const [[msg]] = await pool.query(`SELECT * FROM messages WHERE id = ?`, [id]);
    if (!msg) return res.status(404).json({ message: "Message introuvable" });
    if (msg.sender_id !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }
    await pool.query(
      `UPDATE messages SET content = ?, is_edited = 1 WHERE id = ?`,
      [content, id],
    );
    const updated = await hydrateMessage(id);
    const io = req.app.get("io");
    io.to(`conv:${msg.conversation_id}`).emit("message:edited", updated);
    res.json({ message: updated });
  } catch (err) { next(err); }
};

exports.hydrateMessage = hydrateMessage;
