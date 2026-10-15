import connectToDatabase from "@/lib/db";
import {
  expiredRetentionFilter,
  retentionAuthorized,
} from "@/lib/candle-retention";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Método não permitido" });
  if (!retentionAuthorized(req))
    return res.status(401).json({ error: "Não autorizado" });
  try {
    const connection = await connectToDatabase();
    const db = connection.connection.db;
    if (db.databaseName !== "tabnews")
      return res.status(503).json({ error: "Retenção indisponível" });
    const filter = expiredRetentionFilter();
    const session = await connection.startSession();
    let removed = 0;
    try {
      await session.withTransaction(async () => {
        removed = 0;
        const items = await db
          .collection("candles")
          .find(filter, { session, projection: { _id: 1 } })
          .limit(100)
          .toArray();
        const ids = items.map((item) => item._id);
        if (!ids.length) return;
        await db
          .collection("prayersupports")
          .deleteMany(
            { targetType: "candle", targetId: { $in: ids } },
            { session },
          );
        await db
          .collection("abusereports")
          .deleteMany(
            { targetType: "candle", targetId: { $in: ids } },
            { session },
          );
        const result = await db
          .collection("candles")
          .deleteMany({ ...filter, _id: { $in: ids } }, { session });
        removed = result.deletedCount;
      });
    } finally {
      await session.endSession();
    }
    return res.status(200).json({
      removed,
      remaining: await db.collection("candles").countDocuments(filter),
    });
  } catch {
    return res
      .status(503)
      .json({ error: "Retenção indisponível; repetir a rotina" });
  }
}
