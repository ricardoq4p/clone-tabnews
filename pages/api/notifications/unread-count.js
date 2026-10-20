import { withApi } from "@/lib/api";
import Notification from "@/lib/models/Notification";

export default withApi(
  { methods: ["GET"], auth: true },
  async (_req, res, session) => {
    const count = await Notification.countDocuments({
      recipientId: session.user.id,
      readAt: null,
    });
    return res.status(200).json({ count });
  },
);
