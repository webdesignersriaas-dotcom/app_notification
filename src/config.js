require("dotenv").config();

function clean(value) {
  return value == null ? "" : String(value).trim();
}

const PORT = Number(process.env.PORT || 3201);
const APP_NOTIFICATION_TOKEN = clean(process.env.APP_NOTIFICATION_TOKEN);
const ONESIGNAL_APP_ID = clean(process.env.ONESIGNAL_APP_ID);
const ONESIGNAL_REST_API_KEY = clean(process.env.ONESIGNAL_REST_API_KEY);
const FCM_SERVER_KEY = clean(process.env.FCM_SERVER_KEY);
const RUN_REMINDER_WORKER = clean(process.env.RUN_REMINDER_WORKER).toLowerCase() === "true";
const REMINDER_WORKER_INTERVAL_MS = Number(process.env.REMINDER_WORKER_INTERVAL_MS || 900000);
const REMINDER_BEFORE_MINUTES = Number(process.env.REMINDER_BEFORE_MINUTES || 120);
const REMINDER_LOOKAHEAD_MINUTES = Number(process.env.REMINDER_LOOKAHEAD_MINUTES || 15);

module.exports = {
  APP_NOTIFICATION_TOKEN,
  FCM_SERVER_KEY,
  ONESIGNAL_APP_ID,
  ONESIGNAL_REST_API_KEY,
  PORT,
  REMINDER_BEFORE_MINUTES,
  REMINDER_LOOKAHEAD_MINUTES,
  REMINDER_WORKER_INTERVAL_MS,
  RUN_REMINDER_WORKER,
};
