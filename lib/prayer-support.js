import mongoose from "mongoose";
import PrayerSupport from "./models/PrayerSupport";
export async function supportSummary(type, ids, userId) {
  if (!ids.length) return new Map();
  const mine =
    userId && mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
  const rows = await PrayerSupport.aggregate([
    { $match: { targetType: type, targetId: { $in: ids } } },
    {
      $group: {
        _id: "$targetId",
        count: { $sum: 1 },
        prayed: { $max: { $cond: [{ $eq: ["$userId", mine] }, 1, 0] } },
      },
    },
  ]);
  return new Map(
    rows.map((row) => [
      row._id.toString(),
      { count: row.count, prayed: Boolean(row.prayed) },
    ]),
  );
}
export async function recordPrayer(type, targetId, userId) {
  await PrayerSupport.init();
  try {
    await PrayerSupport.create({ targetType: type, targetId, userId });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  return {
    prayed: true,
    supportCount: await PrayerSupport.countDocuments({
      targetType: type,
      targetId,
    }),
  };
}
