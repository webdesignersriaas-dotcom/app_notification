const { createApp } = require("./app");
const {
  PORT,
  REMINDER_WORKER_INTERVAL_MS,
  RUN_REMINDER_WORKER,
} = require("./config");
const { runAppointmentReminders } = require("./services/reminderService");

const app = createApp();

app.listen(PORT, () => {
  console.log(`app_notification listening on http://localhost:${PORT}`);
  console.log(`health: http://localhost:${PORT}/health`);
});

if (RUN_REMINDER_WORKER) {
  setInterval(() => {
    runAppointmentReminders()
      .then((result) => {
        console.log("reminder worker", result);
      })
      .catch((error) => {
        console.error("reminder worker failed", error);
      });
  }, REMINDER_WORKER_INTERVAL_MS);
}
