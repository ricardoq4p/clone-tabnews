import { withApi } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import {
  isReservedBlogIdentifier,
  normalizeBlogName,
  sanitizePlainField,
  slugifyText,
} from "@/lib/blogs";
import { isObjectId } from "@/lib/validation";

export default withApi(
  {
    methods: ["GET"],
    auth: true,
  },
  async (req, res) => {
    const rawName = sanitizePlainField(req.query?.name || "");
    const rawSlug = String(req.query?.slug || rawName).trim();
    const excludeBlogId =
      typeof req.query?.excludeBlogId === "string" &&
      isObjectId(req.query.excludeBlogId)
        ? req.query.excludeBlogId
        : null;

    const normalizedName = normalizeBlogName(rawName);
    const suggestedSlug = slugifyText(rawSlug || rawName, 60);

    if (rawName && (rawName.length < 3 || rawName.length > 80)) {
      return res.status(200).json({
        available: false,
        nameAvailable: false,
        slugAvailable: false,
        suggestedSlug,
        reason: "O nome do blog deve ter entre 3 e 80 caracteres.",
      });
    }

    if (
      suggestedSlug.length < 3 ||
      suggestedSlug.length > 60 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(suggestedSlug)
    ) {
      return res.status(200).json({
        available: false,
        nameAvailable: false,
        slugAvailable: false,
        suggestedSlug,
        reason: "O endereço (slug) deve ter entre 3 e 60 caracteres válidos.",
      });
    }

    if (
      (rawName && isReservedBlogIdentifier(rawName)) ||
      isReservedBlogIdentifier(suggestedSlug)
    ) {
      return res.status(200).json({
        available: false,
        nameAvailable: false,
        slugAvailable: false,
        suggestedSlug,
        reason: "Este nome ou endereço é reservado pelo sistema.",
      });
    }

    const exclusion = excludeBlogId ? { _id: { $ne: excludeBlogId } } : {};
    const [existingByName, existingBySlug] = await Promise.all([
      normalizedName
        ? Blog.findOne({ normalizedName, ...exclusion })
            .select("_id")
            .lean()
        : Promise.resolve(null),
      Blog.findOne({ slug: suggestedSlug, ...exclusion })
        .select("_id")
        .lean(),
    ]);

    const nameAvailable = !existingByName;
    const slugAvailable = !existingBySlug;
    const available = nameAvailable && slugAvailable;

    let reason = null;
    if (!nameAvailable) {
      reason = "Já existe um blog com este nome na comunidade.";
    } else if (!slugAvailable) {
      reason = "Este endereço (slug) já está em uso.";
    }

    return res.status(200).json({
      available,
      nameAvailable,
      slugAvailable,
      suggestedSlug,
      reason,
    });
  },
);
