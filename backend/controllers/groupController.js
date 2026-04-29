const pool = require("../config/db");
const { buildConversation, ensureMember } = require("./conversationController");

async function isGroupAdmin(convId, userId) {
  const [[row]] = await pool.query(
    `SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
    [convId, userId],
  );
  return row && (row.role === "owner" || row.role === "admin");
}

exports.create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { name, description, avatar_url, member_ids = [] } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "name requis" });

    const members = Array.from(new Set([...member_ids, req.user.id].map(Number)));
    if (members.length < 2) {
      return res.status(400).json({ message: "Au moins 1 autre membre requis" });
    }

    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO conversations (type, name, description, avatar_url, created_by)
       VALUES ('group', ?, ?, ?, ?)`,
      [name.trim(), description || null, avatar_url || null, req.user.id],
    );
    const convId = r.insertId;

    const rows = members.map((uid) => [convId, uid, uid === req.user.id ? "owner" : "member"]);
    await conn.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role) VALUES ?`,
      [rows],
    );

    // Message système
    await conn.query(
      `INSERT INTO messages (conversation_id, sender_id, content, type)
       VALUES (?, ?, ?, 'system')`,
      [convId, req.user.id, `Groupe "${name}" créé`],
    );

    await conn.commit();
    res.status(201).json({ conversation: await buildConversation(convId, req.user.id) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!(await isGroupAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ message: "Admin requis" });
    }
    const { name, description, avatar_url } = req.body;
    await pool.query(
      `UPDATE conversations
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           avatar_url = COALESCE(?, avatar_url)
       WHERE id = ? AND type = 'group'`,
      [name || null, description || null, avatar_url || null, req.params.id],
    );
    res.json({ conversation: await buildConversation(req.params.id, req.user.id) });
  } catch (err) { next(err); }
};

exports.addMembers = async (req, res, next) => {
  try {
    if (!(await isGroupAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ message: "Admin requis" });
    }
    const ids = (req.body.member_ids || []).map(Number).filter(Boolean);
    if (!ids.length) return res.status(400).json({ message: "member_ids vide" });

    const rows = ids.map((uid) => [req.params.id, uid, "member"]);
    await pool.query(
      `INSERT IGNORE INTO conversation_members (conversation_id, user_id, role) VALUES ?`,
      [rows],
    );
    res.json({ conversation: await buildConversation(req.params.id, req.user.id) });
  } catch (err) { next(err); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const self = req.user.id === Number(req.params.userId);
    if (!self && !(await isGroupAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ message: "Admin requis" });
    }
    await pool.query(
      `DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
      [req.params.id, req.params.userId],
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.leave = async (req, res, next) => {
  try {
    const member = await ensureMember(req.params.id, req.user.id);
    if (!member) return res.status(404).json({ message: "Non membre" });
    await pool.query(
      `DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
      [req.params.id, req.user.id],
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};
