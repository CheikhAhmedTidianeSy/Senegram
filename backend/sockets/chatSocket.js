const pool = require("../config/db");

/**
 * Events côté chat :
 *   conversation:join          { conversation_id }
 *   conversation:leave         { conversation_id }
 *   typing                     { conversation_id, is_typing }
 *   message:read               { conversation_id, message_id }
 *
 * Les events "message:new / edited / deleted" sont émis depuis le controller
 * REST pour que la source de vérité reste la DB.
 */
module.exports = function chatSocket(io, socket) {
  const userId = socket.user.id;

  socket.on("conversation:join", ({ conversation_id }) => {
    if (!conversation_id) return;
    socket.join(`conv:${conversation_id}`);
  });

  socket.on("conversation:leave", ({ conversation_id }) => {
    if (!conversation_id) return;
    socket.leave(`conv:${conversation_id}`);
  });

  socket.on("typing", ({ conversation_id, is_typing }) => {
    if (!conversation_id) return;
    socket.to(`conv:${conversation_id}`).emit("typing", {
      conversation_id,
      user_id: userId,
      username: socket.user.username,
      is_typing: !!is_typing,
    });
  });

  socket.on("message:read", async ({ conversation_id, message_id }) => {
    if (!conversation_id || !message_id) return;
    try {
      await pool.query(
        `UPDATE conversation_members
         SET last_read_message_id = GREATEST(COALESCE(last_read_message_id, 0), ?)
         WHERE conversation_id = ? AND user_id = ?`,
        [message_id, conversation_id, userId],
      );
      await pool.query(
        `INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)`,
        [message_id, userId],
      );
      io.to(`conv:${conversation_id}`).emit("message:read", {
        conversation_id,
        message_id,
        user_id: userId,
      });
    } catch (err) {
      console.error("message:read error", err.message);
    }
  });
};
