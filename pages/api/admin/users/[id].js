import Candle from "@/lib/models/Candle";
import PrayerSupport from "@/lib/models/PrayerSupport";
import RosaryProgress from "@/lib/models/RosaryProgress";
import PrivacyRequest from "@/lib/models/PrivacyRequest";
import CalorieEntry from "@/lib/models/CalorieEntry";
import { rejectCrossOriginMutation } from "@/lib/api-security";
import { isObjectId } from "@/lib/validation";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { isSuperadminSession } from "@/lib/auth";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  await connectToDatabase();

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !isSuperadminSession(session)) {
      return res.status(403).json({ error: "Sem permissao" });
    }

    const { id } = req.query;
    if (!isObjectId(id))
      return res.status(400).json({ error: "Identificador invalido" });

    if (session.user.id === id) {
      return res
        .status(400)
        .json({ error: "Nao pode excluir o proprio usuario" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "Usuario nao encontrado" });
    }

    const dependencies = await Promise.all([
      Candle.exists({ ownerId: id }),
      PrayerSupport.exists({ userId: id }),
      RosaryProgress.exists({ userId: id }),
      PrivacyRequest.exists({ userId: id }),
      CalorieEntry.exists({ userId: id }),
    ]);
    if (dependencies.some(Boolean))
      return res.status(409).json({
        error:
          "Esta conta possui dados pessoais vinculados. Use a suspensão de acesso e o processo de privacidade antes de qualquer exclusão.",
      });

    const userMessages = await Message.find({ userId: id })
      .select("_id")
      .lean();
    const messageIds = userMessages.map((message) => message._id);

    await Comment.deleteMany({
      $or: [{ userId: id }, { messageId: { $in: messageIds } }],
    });
    await Message.deleteMany({ userId: id });
    await Community.updateMany(
      { ownerId: id },
      { $set: { deletedAt: new Date() } },
    );
    await Community.updateMany({}, { $pull: { members: id } });
    await User.findByIdAndDelete(id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("ERRO DELETE USER:", error);
    return res.status(500).json({ error: "Erro ao excluir usuario" });
  }
}
