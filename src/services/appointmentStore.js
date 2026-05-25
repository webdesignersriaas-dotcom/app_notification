const fs = require("fs/promises");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const filePath = path.join(dataDir, "appointments.json");

async function readAppointments() {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

async function writeAppointments(items) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(items, null, 2));
}

function clean(value) {
  return value == null ? "" : String(value).trim();
}

async function upsertAppointment(input) {
  const bookingId =
    clean(input.bookingId || input.booking_id) ||
    `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const items = await readAppointments();
  const existingIndex = items.findIndex((item) => clean(item.bookingId) === bookingId);
  const previous = existingIndex >= 0 ? items[existingIndex] : {};
  const next = {
    ...previous,
    bookingId,
    patientName: clean(input.patientName || input.patient_name || previous.patientName),
    doctorName: clean(input.doctorName || input.doctor_name || previous.doctorName),
    appointmentDate: clean(input.appointmentDate || input.appointment_date || previous.appointmentDate),
    appointmentTime: clean(input.appointmentTime || input.appointment_time || previous.appointmentTime),
    oneSignalUserId: clean(input.oneSignalUserId || input.onesignal_user_id || input.player_id || previous.oneSignalUserId),
    oneSignalPushToken: clean(input.oneSignalPushToken || input.one_signal_push_token || previous.oneSignalPushToken),
    fcmToken: clean(input.fcmToken || input.fcm_token || previous.fcmToken),
    status: clean(input.status || previous.status || "Confirmed"),
    updatedAt: new Date().toISOString(),
    createdAt: previous.createdAt || new Date().toISOString(),
    reminderSentAt: input.resetReminder === true ? "" : clean(previous.reminderSentAt),
  };

  if (existingIndex >= 0) items[existingIndex] = next;
  else items.push(next);

  await writeAppointments(items);
  return next;
}

async function markReminderSent(bookingId) {
  const id = clean(bookingId);
  const items = await readAppointments();
  const idx = items.findIndex((item) => clean(item.bookingId) === id);
  if (idx < 0) return null;
  items[idx] = {
    ...items[idx],
    reminderSentAt: new Date().toISOString(),
    lastPushEvent: "appointment_reminder",
  };
  await writeAppointments(items);
  return items[idx];
}

module.exports = {
  markReminderSent,
  readAppointments,
  upsertAppointment,
};
