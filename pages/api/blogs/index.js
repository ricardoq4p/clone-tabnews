import { withApi, requireCondition, ApiError } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import {
  BLOG_DIRECTORY_PAGE_SIZE,
  resolveBlogEditorialSession,
  validateBlogInput,
} from "@/lib/blogs";

export default withApi(
  {
    methods: ["GET", "POST"],
    scope: "blogs",
    limit: 8,
    windowMs: 600000,
  },
  async (req, res, session) => {
    const actor = session
      ? await resolveBlogEditorialSession(session, User)
      : null;

    if (req.method === "GET") {
      const rawPage = Number.parseInt(String(req.query?.page || "1"), 10);
      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
      const limit = BLOG_DIRECTORY_PAGE_SIZE;
      const skip = (page - 1) * limit;

      const filter = { status: "active" };
      const [total, blogs, myBlog] = await Promise.all([
        Blog.countDocuments(filter),
        Blog.find(filter)
          .sort({ updatedAt: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        actor?.canPublish && actor.userId
          ? Blog.findOne({ ownerId: actor.userId }).lean()
          : Promise.resolve(null),
      ]);

      const blogIds = blogs.map((b) => b._id);
      const ownerIds = blogs.map((b) => b.ownerId);

      const [owners, postStats] = await Promise.all([
        ownerIds.length
          ? User.find({ _id: { $in: ownerIds } })
              .select("name")
              .lean()
          : Promise.resolve([]),
        blogIds.length
          ? BlogPost.aggregate([
              {
                $match: {
                  blogId: { $in: blogIds },
                  status: "published",
                },
              },
              {
                $group: {
                  _id: "$blogId",
                  publishedCount: { $sum: 1 },
                  lastPublishedAt: { $max: "$publishedAt" },
                },
              },
            ])
          : Promise.resolve([]),
      ]);

      const ownerMap = new Map(
        owners.map((user) => [String(user._id), user.name]),
      );
      const statsMap = new Map(
        postStats.map((stat) => [
          String(stat._id),
          {
            publishedCount: stat.publishedCount || 0,
            lastPublishedAt: stat.lastPublishedAt || null,
          },
        ]),
      );

      const items = blogs.map((blog) => {
        const stat = statsMap.get(String(blog._id)) || {
          publishedCount: 0,
          lastPublishedAt: null,
        };
        return {
          _id: String(blog._id),
          name: blog.name,
          slug: blog.slug,
          description: blog.description,
          authorBio: blog.authorBio,
          authorName:
            ownerMap.get(String(blog.ownerId)) || "Membro da comunidade",
          publishedCount: stat.publishedCount,
          lastPublishedAt: stat.lastPublishedAt,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        };
      });

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return res.status(200).json({
        items,
        page,
        totalPages,
        total,
        hasMore: page < totalPages,
        canPublish: Boolean(actor?.canPublish),
        myBlog: myBlog
          ? {
              _id: String(myBlog._id),
              name: myBlog.name,
              slug: myBlog.slug,
            }
          : null,
      });
    }

    requireCondition(
      actor?.canPublish,
      403,
      "Apenas os autores autorizados podem publicar no Blog.",
    );

    requireCondition(
      !req.body?.ownerId ||
        String(req.body.ownerId) === String(actor.userId) ||
        String(req.body.ownerId) === String(session.user.id),
      403,
      "Você não pode criar um blog em nome de outra pessoa.",
    );

    const validation = validateBlogInput(req.body || {});
    requireCondition(validation.ok, 400, validation.error);

    const { name, normalizedName, slug, description, authorBio } =
      validation.value;

    await Blog.init();

    const existingUserBlog = await Blog.findOne({
      ownerId: actor.userId,
    }).lean();
    requireCondition(
      !existingUserBlog,
      409,
      "Você já possui um blog pessoal cadastrado.",
    );

    const duplicateBlog = await Blog.findOne({
      $or: [{ normalizedName }, { slug }],
    }).lean();
    if (duplicateBlog) {
      if (duplicateBlog.normalizedName === normalizedName) {
        throw new ApiError(
          409,
          "Já existe um blog com este nome na comunidade.",
        );
      }
      throw new ApiError(
        409,
        "Este endereço (slug) já está em uso por outro blog.",
      );
    }

    try {
      const created = await Blog.create({
        ownerId: actor.userId,
        name,
        normalizedName,
        slug,
        description,
        authorBio,
        status: "active",
      });
      return res.status(201).json({
        blog: {
          _id: String(created._id),
          ownerId: String(created.ownerId),
          name: created.name,
          slug: created.slug,
          description: created.description,
          authorBio: created.authorBio,
          status: created.status,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError(
          409,
          "Este blog, nome ou endereço já foi registrado. Confira os dados e tente novamente.",
        );
      }
      throw error;
    }
  },
);
