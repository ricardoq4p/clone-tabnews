import { withApi, requireCondition } from "@/lib/api";
import Community from "@/lib/models/Community";
import { escapeRegex } from "@/lib/validation";

export default withApi({ methods: ["GET"], admin: true }, async (req, res) => {
  const { q = "", privacy = "", sort = "newest", page = "1" } = req.query;
  requireCondition(
    typeof q === "string" &&
      q.length <= 60 &&
      ["", "public", "private"].includes(privacy) &&
      ["newest", "oldest", "name"].includes(sort) &&
      typeof page === "string" &&
      /^[1-9]\d{0,5}$/.test(page),
    400,
    "Filtros inválidos.",
  );
  const filter = { deletedAt: null };
  if (q.trim()) filter.name = { $regex: escapeRegex(q.trim()), $options: "i" };
  if (privacy) filter.privacy = privacy;
  const order =
    sort === "name"
      ? { name: 1, _id: 1 }
      : {
          createdAt: sort === "oldest" ? 1 : -1,
          _id: sort === "oldest" ? 1 : -1,
        };
  const [communities, filtered, total, publicCount, privateCount] =
    await Promise.all([
      Community.find(filter)
        .select("name description avatar privacy ownerId createdAt members")
        .populate("ownerId", "name")
        .sort(order)
        .skip((Number(page) - 1) * 20)
        .limit(20)
        .lean(),
      Community.countDocuments(filter),
      Community.countDocuments({ deletedAt: null }),
      Community.countDocuments({ deletedAt: null, privacy: "public" }),
      Community.countDocuments({ deletedAt: null, privacy: "private" }),
    ]);
  return res.status(200).json({
    items: communities.map(({ members, ownerId, ...community }) => ({
      ...community,
      ownerName: ownerId?.name || "Participante indisponível",
      membersCount: members?.length || 0,
    })),
    filtered,
    total,
    publicCount,
    privateCount,
    pages: Math.max(1, Math.ceil(filtered / 20)),
  });
});
