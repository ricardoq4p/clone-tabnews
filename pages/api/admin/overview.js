import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { isSuperadminSession } from "@/lib/auth";

const ONLINE_WINDOW_IN_MS = 1000 * 60 * 2;
export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !isSuperadminSession(session)) {
      return res.status(403).json({ error: "Sem permissao" });
    }

    const [users, messages, comments, communities] = await Promise.all([
      User.find()
        .select(
          "name email username avatar role isVerified createdAt lastLoginAt lastSeenAt",
        )
        .sort({ createdAt: -1 })
        .lean(),
      Message.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Comment.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Community.find()
        .populate("ownerId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      onlineUsers: users
        .filter(
          (user) =>
            user.lastSeenAt &&
            Date.now() - new Date(user.lastSeenAt).getTime() <= ONLINE_WINDOW_IN_MS,
        )
        .map((user) => ({
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          lastSeenAt: user.lastSeenAt,
        })),
      users: users.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username || "",
        avatar: user.avatar || "",
        role: user.role || "user",
        isVerified: Boolean(user.isVerified),
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lastSeenAt: user.lastSeenAt,
        isOnline: Boolean(
          user.lastSeenAt &&
            Date.now() - new Date(user.lastSeenAt).getTime() <= ONLINE_WINDOW_IN_MS,
        ),
      })),
      messages: messages.map((message) => ({
        _id: message._id.toString(),
        content: message.content,
        createdAt: message.createdAt,
        authorName: message.userId?.name || "Usuario",
        authorEmail: message.userId?.email || "",
      })),
      comments: comments.map((comment) => ({
        _id: comment._id.toString(),
        content: comment.content,
        messageId: comment.messageId?.toString?.() || comment.messageId,
        createdAt: comment.createdAt,
        authorName: comment.userId?.name || comment.author || "Usuario",
        authorEmail: comment.userId?.email || "",
      })),
      communities: communities.map((community) => ({
        _id: community._id.toString(),
        name: community.name,
        description: community.description || "",
        privacy: community.privacy,
        ownerName: community.ownerId?.name || "Usuario",
        ownerEmail: community.ownerId?.email || "",
        membersCount: Array.isArray(community.members) ? community.members.length : 0,
        createdAt: community.createdAt,
      })),
    });
  } catch (error) {
    console.error("ERRO ADMIN OVERVIEW:", error);
    return res.status(500).json({ error: "Erro ao carregar painel admin" });
  }
}
