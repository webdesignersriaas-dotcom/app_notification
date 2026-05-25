const express = require("express");
const { upsertAppointment } = require("../services/appointmentStore");
const { runAppointmentReminders } = require("../services/reminderService");
const { sendAppointmentPush } = require("../services/pushService");

const router = express.Router();

router.post("/appointment-notifications/send", async (req, res) => {
  try {
    const result = await sendAppointmentPush(req.body || {});
    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, message: e.message });
  }
});

router.post("/appointments/upsert", async (req, res) => {
  try {
    const body = req.body || {};
    const appointment = await upsertAppointment(body);
    let push = null;
    if (body.sendPush !== false && body.event) {
      push = await sendAppointmentPush({ ...appointment, event: body.event });
    }
    return res.json({ success: true, data: { appointment, push } });
  } catch (e) {
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
