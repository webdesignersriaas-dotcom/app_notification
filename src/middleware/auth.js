const { APP_NOTIFICATION_TOKEN } = require("../config");

function requireNotificationToken(req, res, next) {
  if (!APP_NOTIFICATION_TOKEN) {
    return res.status(503).json({
      success: false,
      message: "APP_NOTIFICATION_TOKEN is not configured",
    });
  }

  const headerToken = req.get("X-Notification-Token") || "";
  const auth = req.get("Authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  const supplied = (headerToken || bearer).trim();

  if (supplied !== APP_NOTIFICATION_TOKEN) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  return next();
}

module.exports = { requireNotificationToken };
