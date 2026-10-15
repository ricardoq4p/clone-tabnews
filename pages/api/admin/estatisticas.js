import { withApi } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import User from "@/lib/models/User";
import RosaryProgress from "@/lib/models/RosaryProgress";
import PrayerSupport from "@/lib/models/PrayerSupport";
import AbuseReport from "@/lib/models/AbuseReport";
export default withApi({ methods: ["GET"], admin: true }, async (req, res) => {
  const now = new Date();
  const [users, candles, activeCandles, prayers, rosaries, reports] =
    await Promise.all([
      User.countDocuments(),
      Candle.countDocuments(),
      Candle.countDocuments({ status: "active", expiresAt: { $gt: now } }),
      PrayerSupport.countDocuments(),
      RosaryProgress.countDocuments({ completed: true }),
      AbuseReport.countDocuments({ status: "pending" }),
    ]);
  return res
    .status(200)
    .json({ users, candles, activeCandles, prayers, rosaries, reports });
});
