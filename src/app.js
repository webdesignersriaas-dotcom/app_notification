const express = require("express");
const cors = require("cors");
const appointmentNotificationsRouter = require("./routes/appointmentNotifications");
const { requireNotificationToken } = require("./middleware/auth");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, service: "app_notification" });
  });

  app.use("/api/v1", requireNotificationToken, appointmentNotificationsRouter);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
