import { serverIntegrationEnabled } from "./integration-policy";
import Pusher from "pusher";

let client;
export function getPusher() {
  if (!serverIntegrationEnabled("realtime"))
    throw new Error("Tempo real desativado");
  if (!client)
    client = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  return client;
}

// Events carry no content. The subscriber refetches through the authorized API.
// This also prevents a formerly authorized connection from receiving private data.
export async function notifyChange(kind, event, communityId = null) {
  if (
    !serverIntegrationEnabled("realtime") ||
    ![
      process.env.PUSHER_APP_ID,
      process.env.PUSHER_KEY,
      process.env.PUSHER_SECRET,
      process.env.PUSHER_CLUSTER,
    ].every(Boolean)
  )
    return;
  const channel = communityId ? `private-community-${communityId}` : kind;
  try {
    await getPusher().trigger(channel, event, { refresh: true });
  } catch {
    console.error("Realtime notification unavailable", { kind, event });
  }
}
