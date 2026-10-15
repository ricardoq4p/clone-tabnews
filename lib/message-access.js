import Message from "./models/Message";
import Community from "./models/Community";
import { canReadMessage } from "./permissions";
import { isObjectId } from "./validation";
export async function readableMessage(id, session) {
  if (!isObjectId(id)) return null;
  const message = await Message.findById(id);
  const community = message?.communityId
    ? await Community.findById(message.communityId)
    : null;
  return canReadMessage(message, community, session?.user?.id)
    ? { message, community }
    : null;
}
