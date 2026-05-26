const express = require("express");
const { upsertAppointment } = require("../services/appointmentStore");
const { listNotificationsForTarget, saveNotification } = require("../services/notificationHistory");
const { runAppointmentReminders } = require("../services/reminderService");
const { buildAppointmentPush, sendAppointmentPush } = require("../services/pushService");

const router = express.Router();

router.post("/appointment-notifications/send", async (req, res) => {
  try {
    const result = await sendAppointmentPush(req.body || {});
    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, message: e.message });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const items = await listNotificationsForTarget(req.query || {});
    return res.json({ success: true, data: { notifications: items } });
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, message: e.message });
  }
});

router.post("/appointments/upsert", async (req, res) => {
  try {
    const body = req.body || {};
    const appointment = await upsertAppointment(body);
    let push = null;
    let notification = null;
    if (body.sendPush !== false && body.event) {
      const built = buildAppointmentPush({ ...appointment, event: body.event });
      push = await sendAppointmentPush({ ...appointment, event: body.event });
      notification = await saveNotification({
        appointment,
        event: built.event,
        title: built.title,
        body: built.body,
        data: built.data,
        push,
      });
      console.log("[appointment-notifications] push result", JSON.stringify({
        event: body.event,
        bookingId: appointment.bookingId,
        sent: push && push.sent,
        firebase: push && push.firebase,
        oneSignal: push && push.oneSignal,
      }));
    }
    return res.json({ success: true, data: { appointment, push, notification } });
  } catch (e) {
    console.error("[appointment-notifications] upsert failed", e);
    return res.status(e.status || 500).json({ success: false, message: e.message });
  }
});

router.post("/reminders/run", async (req, res) => {
  try {
    const result = await runAppointmentReminders(req.body || {});
    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, message: e.message });
  }
});

module.exports = router;
