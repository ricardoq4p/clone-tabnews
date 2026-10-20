import { serverIntegrationEnabled } from "./integration-policy";
import { getPusher } from "./pusher";

export async function notifyNotificationChange(userId) {
  if (!serverIntegrationEnabled("realtime") || !userId) return;
  if (
    ![
      process.env.PUSHER_APP_ID,
      process.env.PUSHER_KEY,
      process.env.PUSHER_SECRET,
      process.env.PUSHER_CLUSTER,
    ].every(Boolean)
  )
    return;
  try {
    await getPusher().trigger(
      `private-user-${userId}`,
      "notifications-changed",
      {
        refresh: true,
      },
    );
  } catch {
    console.error("Notification realtime unavailable");
  }
}
