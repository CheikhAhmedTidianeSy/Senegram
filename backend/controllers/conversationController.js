const pool = require("../config/db");

/**
 * Vérifie que l'utilisateur courant est membre de la conversation.
 */
async function ensureMember(convId, userId) {
  const [[row]] = await pool.query(
    `SELECT id, role FROM conversation_members WHERE conversation_id = ? AND user_id = ? LIMIT 1`,
    [convId, userId],
  );
  return row || null;
}

/**
 * Construit l'objet complet "conversation" avec :
 *   - members (array)
 *   - last_message (objet ou null)
 *   - unread_count pour l'utilisateur courant
 *   - "name" / "avatar_url" calculés côté frontend pour les privés
 */
async function buildConversation(convId, userId) {
  const [[conv]] = await pool.query(`SELECT * FROM conversations WHERE id = ?`, [convId]);
  if (!conv) return null;

  const [members] = await pool.query(
    `SELECT u.id, u.username, u.email, u.phone, u.bio,
            u.display_name, u.avatar_url, u.status, u.is_online, u.last_seen,
            c.alias,
            cm.role, cm.is_muted, cm.last_read_message_id
     FROM conversation_members cm
     JOIN users u ON u.id = cm.user_id
     LEFT JOIN contacts c ON c.user_id = ? AND c.contact_user_id = u.id
     WHERE cm.conversation_id = ?`,
    [userId, convId],
  );

  const [[lastMsg]] = await pool.query(
    `SELECT m.id, m.sender_id, m.content, m.type, m.created_at,
            u.display_name AS sender_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ? AND m.is_deleted = 0
     ORDER BY m.id DESC LIMIT 1`,
    [convId],
  );

  const [[unread]] = await pool.query(
    `SELECT COUNT(*) AS n
     FROM messages m
     LEFT JOIN conversation_members cm
       ON cm.conversation_id = m.conversation_id AND cm.user_id = ?
     WHERE m.conversation_id = ?
       AND m.sender_id <> ?
       AND m.is_deleted = 0
       AND (cm.last_read_message_id IS NULL OR m.id > cm.last_read_message_id)`,
    [userId, convId, userId],
  );
  const [pinned] = await pool.query(
    `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at,
            m.pinned_by, m.pinned_at,
            u.display_name AS sender_name,
            p.display_name AS pinned_by_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN users p ON p.id = m.pinned_by
     WHERE m.conversation_id = ?
       AND m.is_pinned = 1
       AND m.is_deleted = 0
     ORDER BY m.pinned_at DESC
     LIMIT 5`,
    [convId],
  );

  return {
    ...conv,
    members,
    last_message: lastMsg || null,
    pinned_messages: pinned,
    unread_count: unread.n,
  };
}

exports.list = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_members cm
         ON cm.conversation_id = c.id
        AND cm.user_id = ?
       ORDER BY c.updated_at DESC, c.id DESC`,
      [userId],
    );

    const conversations = (await Promise.all(
      rows.map((row) => buildConversation(row.id, userId)),
    )).filter(Boolean);

    res.json({ conversations });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const member = await ensureMember(req.params.id, req.user.id);
    if (!member) return res.status(403).json({ message: "Accès refusé" });
    res.json({ conversation: await buildConversation(req.params.id, req.user.id) });
  } catch (err) { next(err); }
};

/**
 * Ouvre (ou crée) une conversation privée 1-1 avec `other_user_id`.
 */
exports.openPrivate = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const other = Number(req.body.other_user_id);
    if (!other || other === req.user.id) {
      return res.status(400).json({ message: "other_user_id invalide" });
    }

    const [[target]] = await conn.query("SELECT id FROM users WHERE id = ?", [other]);
    if (!target) return res.status(404).json({ message: "Destinataire introuvable" });

    // Cherche une conv privée existante entre les 2
    const [existing] = await conn.query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = ?
       JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = ?
       WHERE c.type = 'private'
       LIMIT 1`,
      [req.user.id, other],
    );
    if (existing.length) {
      return res.json({ conversation: await buildConversation(existing[0].id, req.user.id) });
    }

    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO conversations (type, created_by) VALUES ('private', ?)`,
      [req.user.id],
    );
    const convId = r.insertId;
    await conn.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'member'), (?, ?, 'member')`,
      [convId, req.user.id, convId, other],
    );
    await conn.commit();

    const io = req.app.get("io");
    io.joinUserConversation?.(req.user.id, convId);
    io.joinUserConversation?.(other, convId);

    res.status(201).json({ conversation: await buildConversation(convId, req.user.id) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.buildConversation = buildConversation;
exports.ensureMember      = ensureMember;
