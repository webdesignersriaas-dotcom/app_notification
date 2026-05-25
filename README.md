# SRIAAS App Notification Backend

Standalone push notification service for appointment booking, rescheduling, and reminders.

This service does **not** create in-app notification records and does **not** use Apps Script.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Required environment:

| Variable | Purpose |
| --- | --- |
| `APP_NOTIFICATION_TOKEN` | Secret sent by the Flutter app as `X-Notification-Token` |
| `ONESIGNAL_APP_ID` | OneSignal app id |
| `ONESIGNAL_REST_API_KEY` | OneSignal REST API key |
| `FIREBASE_PROJECT_ID` | Firebase project id for FCM HTTP v1 |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account client email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key, with `\n` line breaks |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional alternative to the split Firebase fields |

`FCM_SERVER_KEY` is the old Firebase legacy key and is not used by this service.
On Render, either add `FIREBASE_SERVICE_ACCOUNT_JSON` as the full service account JSON
or add the three split Firebase variables above.

## Routes

All `/api/v1/*` routes require `X-Notification-Token: <APP_NOTIFICATION_TOKEN>` or `Authorization: Bearer <APP_NOTIFICATION_TOKEN>`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Public health check |
| `POST` | `/api/v1/appointment-notifications/send` | Send a push immediately |
| `POST` | `/api/v1/appointments/upsert` | Store/update appointment push tokens and optionally send booking/reschedule push |
| `POST` | `/api/v1/reminders/run` | Scan stored appointments and send due reminders |

## Reminder Scheduling

Use an external cron service to call:

```bash
curl -X POST "$BASE_URL/api/v1/reminders/run" \
  -H "X-Notification-Token: $APP_NOTIFICATION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Recommended cadence: every 15 minutes.
