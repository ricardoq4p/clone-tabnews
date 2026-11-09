import { withApi, requireCondition, ApiError } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import {
  canManageBlog,
  estimateReadingTimeMinutes,
  resolveBlogEditorialSession,
  validateBlogInput,
} from "@/lib/blogs";

export default withApi(
  {
    methods: ["GET", "PATCH"],
    auth: true,
    scope: "blogs-owner",
    limit: 15,
    windowMs: 600000,
  },
  async (req, res, session) => {
    const actor = await resolveBlogEditorialSession(session, User);
    requireCondition(
      actor?.canPublish,
      403,
      "Apenas os autores autorizados podem acessar o painel editorial do Blog.",
    );

    if (req.method === "GET") {
      const blog = await Blog.findOne({ ownerId: actor.userId }).lean();
      if (!blog) {
        return res.status(200).json({ blog: null, posts: [] });
      }

      const posts = await BlogPost.find({ blogId: blog._id })
        .sort({ updatedAt: -1, _id: -1 })
        .lean();

      return res.status(200).json({
        blog: {
          _id: String(blog._id),
          ownerId: String(blog.ownerId),
          name: blog.name,
          slug: blog.slug,
          description: blog.description,
          authorBio: blog.authorBio,
          coverImage: blog.coverImage || "",
          status: blog.status,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        },
        posts: posts.map((post) => ({
          _id: String(post._id),
          blogId: String(post.blogId),
          authorId: String(post.authorId),
          title: post.title,
          subtitle: post.subtitle || "",
          slug: post.slug,
          category: post.category,
          content: post.content,
          coverImage: post.coverImage || "",
          tags: Array.isArray(post.tags) ? post.tags : [],
          featured: Boolean(post.featured),
          readingTimeMinutes: estimateReadingTimeMinutes(post.content),
          status: post.status,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          publishedAt: post.publishedAt,
        })),
      });
    }

    const blog = await Blog.findOne({ ownerId: actor.userId });
    requireCondition(blog, 404, "Você ainda não possui um blog cadastrado.");
    requireCondition(
      canManageBlog(blog, actor.session),
      403,
      "Você só pode administrar o seu próprio blog.",
    );

    const validation = validateBlogInput({
      name: req.body?.name ?? blog.name,
      slug: req.body?.slug ?? blog.slug,
      description: req.body?.description ?? blog.description,
      authorBio: req.body?.authorBio ?? blog.authorBio,
      coverImage: req.body?.coverImage ?? blog.coverImage ?? "",
    });
    requireCondition(validation.ok, 400, validation.error);

    const { name, normalizedName, slug, description, authorBio, coverImage } =
      validation.value;

    const duplicate = await Blog.findOne({
      _id: { $ne: blog._id },
      $or: [{ normalizedName }, { slug }],
    }).lean();

    if (duplicate) {
      if (duplicate.normalizedName === normalizedName) {
        throw new ApiError(
          409,
          "Já existe outro blog com este nome na comunidade.",
        );
      }
      throw new ApiError(
        409,
        "Este endereço (slug) já está em uso por outro blog.",
      );
    }

    blog.name = name;
    blog.normalizedName = normalizedName;
    blog.slug = slug;
    blog.description = description;
    blog.authorBio = authorBio;
    blog.coverImage = coverImage || "";
    blog.updatedAt = new Date();

    try {
      await blog.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError(
          409,
          "Este nome ou endereço já está em uso por outro blog.",
        );
      }
      throw error;
    }

    return res.status(200).json({
      blog: {
        _id: String(blog._id),
        ownerId: String(blog.ownerId),
        name: blog.name,
        slug: blog.slug,
        description: blog.description,
        authorBio: blog.authorBio,
        coverImage: blog.coverImage || "",
        status: blog.status,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      },
    });
  },
);
