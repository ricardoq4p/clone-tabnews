import { rejectCrossOriginMutation } from "@/lib/api-security";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import connectToDatabase from "@/lib/db";
import Community from "@/lib/models/Community";
import { canReadCommunity } from "@/lib/permissions";
import { getPusher } from "@/lib/pusher";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  if (req.method !== "POST")
    return res.status(405).json({ error: "Metodo nao permitido" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Nao autenticado" });
    const { channel_name: channel, socket_id: socket } = req.body || {};
    if (
      typeof channel !== "string" ||
      !/^private-community-[a-f0-9]{24}$/i.test(channel) ||
      typeof socket !== "string" ||
      !/^\d+\.\d+$/.test(socket)
    )
      return res.status(400).json({ error: "Canal invalido" });
    await connectToDatabase();
    const community = await Community.findById(
      channel.slice("private-community-".length),
    );
    if (!canReadCommunity(community, session.user.id))
      return res.status(403).json({ error: "Sem permissao" });
    return res.status(200).json(getPusher().authorizeChannel(socket, channel));
  } catch {
    return res.status(503).json({ error: "Canal indisponivel" });
  }
}
