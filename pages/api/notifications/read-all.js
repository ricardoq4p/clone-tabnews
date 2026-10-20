import { withApi } from "@/lib/api";
import Notification from "@/lib/models/Notification";

export default withApi(
  {
    methods: ["PATCH"],
    auth: true,
    scope: "notifications-read-all",
    limit: 10,
  },
  async (_req, res, session) => {
    const result = await Notification.updateMany(
      { recipientId: session.user.id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return res
      .status(200)
      .json({ success: true, updated: result.modifiedCount });
  },
);
