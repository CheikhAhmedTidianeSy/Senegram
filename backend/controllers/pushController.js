const webpush = require("web-push");
const pool = require("../config/db");

/**
 * Configure web-push with VAPID keys
 */
function initWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:sarrfallou267@gmail.com";

  if (!publicKey || !privateKey) {
    console.warn("⚠️ VAPID keys not configured - push notifications disabled");
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

const webPushEnabled = initWebPush();

/**
 * Save push subscription for user
 */
async function subscribe(req, res) {
  if (!webPushEnabled) {
    return res.status(503).json({ message: "Push notifications not configured" });
  }

  try {
    const userId = req.user.id;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription data" });
    }

    // Upsert subscription
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), updated_at = NOW()`,
      [userId, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    res.status(500).json({ message: "Failed to save subscription" });
  }
}

/**
 * Remove push subscription
 */
async function unsubscribe(req, res) {
  if (!webPushEnabled) {
    return res.status(503).json({ message: "Push notifications not configured" });
  }

  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint required" });
    }

    await pool.query(
      `DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`,
      [userId, endpoint]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    res.status(500).json({ message: "Failed to remove subscription" });
  }
}

/**
 * Send push notification to user
 */
async function sendToUser(userId, payload) {
  if (!webPushEnabled) return { sent: 0, failed: 0 };

  try {
    const [subs] = await pool.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
      [userId]
    );

    if (!subs.length) return { sent: 0, failed: 0 };

    const pushPromises = subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        return { success: true };
      } catch (err) {
        // Remove invalid subscriptions (410 Gone, 404 Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query(
            `DELETE FROM push_subscriptions WHERE endpoint = ?`,
            [sub.endpoint]
          );
        }
        console.error("Push send error:", err.message);
        return { success: false, error: err.message };
      }
    });

    const results = await Promise.all(pushPromises);
    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    return { sent, failed };
  } catch (err) {
    console.error("Push notification error:", err);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send push to multiple users
 */
async function sendToUsers(userIds, payload) {
  if (!webPushEnabled || !userIds.length) return { sent: 0, failed: 0 };

  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}

/**
 * Test push notification (admin only)
 */
async function testPush(req, res) {
  if (!webPushEnabled) {
    return res.status(503).json({ message: "Push notifications not configured" });
  }

  try {
    const userId = req.user.id;
    const result = await sendToUser(userId, {
      title: "Test Senegram",
      body: "Les notifications push fonctionnent ! 🎉",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: "test-notification",
      data: { url: "/", timestamp: Date.now() },
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Test push error:", err);
    res.status(500).json({ message: "Test push failed" });
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  sendToUser,
  sendToUsers,
  testPush,
  webPushEnabled,
};