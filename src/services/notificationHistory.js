const fs = require("fs/promises");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const filePath = path.join(dataDir, "notifications.json");

function clean(value) {
  return value == null ? "" : String(value).trim();
}

async function readNotifications() {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

async function writeNotifications(items) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(items.slice(0, 500), null, 2));
}

async function saveNotification({ appointment, event, title, body, data, push }) {
  const items = await readNotifications();
  const bookingId = clean(data.bookingId || appointment.bookingId);
  const appointmentTime = clean(data.appointmentTime);
  const id = bookingId
    ? `appointment-${bookingId}-${event}-${appointmentTime.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`
    : `appointment-${event}-${Date.now()}`;
  const existingIndex = items.findIndex((item) => clean(item.id) === id);
  const item = {
    id,
    title: clean(title) || "Notification",
    body: clean(body),
    type: clean(data.type) || "appointment",
    event: clean(event),
    bookingId,
    appointmentDate: clean(data.appointmentDate),
    appointmentTime,
    doctorName: clean(data.doctorName),
    patientName: clean(data.patientName),
    patientEmail: clean(data.patientEmail),
    patientPhone: clean(data.patientPhone),
    appointmentType: clean(data.appointmentType),
    appointmentFor: clean(data.appointmentFor),
    pageUrl: clean(data.pageUrl),
    diseaseName: clean(data.diseaseName),
    oneSignalUserId: clean(appointment.oneSignalUserId),
    oneSignalPushToken: clean(appointment.oneSignalPushToken),
    fcmToken: clean(appointment.fcmToken),
    data: data || {},
    push: push || null,
    sentAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) items[existingIndex] = { ...items[existingIndex], ...item };
  else items.unshift(item);
  await writeNotifications(items);
  return item;
}

async function listNotificationsForTarget(query = {}) {
  const oneSignalUserId = clean(query.oneSignalUserId || query.onesignal_user_id || query.player_id);
  const oneSignalPushToken = clean(query.oneSignalPushToken || query.one_signal_push_token);
  const fcmToken = clean(query.fcmToken || query.fcm_token);
  const limit = Math.min(Number(query.limit) || 50, 100);
  const items = await readNotifications();
  return items
    .filter((item) => {
      if (oneSignalUserId && item.oneSignalUserId === oneSignalUserId) return true;
      if (oneSignalPushToken && item.oneSignalPushToken === oneSignalPushToken) return true;
      if (fcmToken && item.fcmToken === fcmToken) return true;
      return false;
    })
    .slice(0, limit);
}

module.exports = {
  listNotificationsForTarget,
  saveNotification,
};
