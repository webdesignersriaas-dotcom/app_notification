const {
  FCM_SERVER_KEY,
  ONESIGNAL_APP_ID,
  ONESIGNAL_REST_API_KEY,
} = require("../config");

function clean(value) {
  return value == null ? "" : String(value).trim();
}

function stringData(data = {}) {
  const out = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value !== undefined && value !== null) out[key] = String(value);
  }
  return out;
}

async function sendOneSignalPush({ oneSignalUserId, title, body, data }) {
  const userId = clean(oneSignalUserId);
  if (!userId) return { sent: false, skipped: "missing_onesignal_user_id" };
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return { sent: false, skipped: "onesignal_not_configured" };
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { onesignal_id: [userId] },
      target_channel: "push",
      headings: { en: clean(title) || "Appointment Update" },
      contents: { en: clean(body) },
      data: data || {},
    }),
  });

  const detail = await parseResponse(response);
  if (!response.ok) return { sent: false, provider: "onesignal", status: response.status, detail };
  return { sent: true, provider: "onesignal", detail };
}

async function sendFirebasePush({ fcmToken, title, body, data }) {
  const token = clean(fcmToken);
  if (!token) return { sent: false, skipped: "missing_fcm_token" };
  if (!FCM_SERVER_KEY) return { sent: false, skipped: "firebase_not_configured" };

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    body: JSON.stringify({
      to: token,
      priority: "high",
      notification: {
        title: clean(title) || "Appointment Update",
        body: clean(body),
      },
      data: stringData(data),
    }),
  });

  const detail = await parseResponse(response);
  if (!response.ok) return { sent: false, provider: "firebase", status: response.status, detail };
  return { sent: true, provider: "firebase", detail };
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_) {
    return { message: text };
  }
}

function titleForEvent(event) {
  if (event === "booking_confirmed") return "Appointment Confirmed";
  if (event === "appointment_rescheduled") return "Appointment Rescheduled";
  if (event === "appointment_reminder") return "Appointment Reminder";
  return "Appointment Update";
}

function bodyForEvent({ event, appointmentDate, appointmentTime, doctorName }) {
  const doctor = clean(doctorName) || "Doctor";
  const date = clean(appointmentDate);
  const time = clean(appointmentTime);
  if (event === "booking_confirmed") {
    return `Your appointment with ${doctor} is confirmed for ${date} at ${time}.`;
  }
  if (event === "appointment_rescheduled") {
    return `Your appointment with ${doctor} is rescheduled for ${date} at ${time}.`;
  }
  if (event === "appointment_reminder") {
    return `Reminder: your appointment with ${doctor} is at ${time}.`;
  }
  return `Your appointment with ${doctor} is scheduled for ${date} at ${time}.`;
}

async function sendAppointmentPush(input) {
  const event = clean(input.event) || "appointment_update";
  const data = {
    type: "appointment",
    event,
    bookingId: clean(input.bookingId || input.booking_id),
    appointmentDate: clean(input.appointmentDate || input.appointment_date),
    appointmentTime: clean(input.appointmentTime || input.appointment_time),
    doctorName: clean(input.doctorName || input.doctor_name),
    screen: "appointment_details",
  };
  const title = clean(input.title) || titleForEvent(event);
  const body = clean(input.body) || bodyForEvent({ ...data, event });

  const [oneSignal, firebase] = await Promise.all([
    sendOneSignalPush({
      oneSignalUserId: input.oneSignalUserId || input.onesignal_user_id || input.player_id,
      title,
      body,
      data,
    }),
    sendFirebasePush({
      fcmToken: input.fcmToken || input.fcm_token,
      title,
      body,
      data,
    }),
  ]);

  return {
    event,
    firebase,
    oneSignal,
    sent: Boolean(oneSignal.sent || firebase.sent),
  };
}

module.exports = {
  bodyForEvent,
  sendAppointmentPush,
  titleForEvent,
};
