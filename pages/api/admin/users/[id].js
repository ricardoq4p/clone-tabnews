import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { isSuperadminSession } from "@/lib/auth";

export default async function handler(req, res) {
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

    if (session.user.id === id) {
      return res.status(400).json({ error: "Nao pode excluir o proprio usuario" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "Usuario nao encontrado" });
    }

    const userMessages = await Message.find({ userId: id }).select("_id").lean();
    const messageIds = userMessages.map((message) => message._id);

    await Comment.deleteMany({
      $or: [{ userId: id }, { messageId: { $in: messageIds } }],
    });
    await Message.deleteMany({ userId: id });
    await Community.deleteMany({ ownerId: id });
    await Community.updateMany({}, { $pull: { members: id } });
    await User.findByIdAndDelete(id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("ERRO DELETE USER:", error);
    return res.status(500).json({ error: "Erro ao excluir usuario" });
  }
}
