import { withApi, requireCondition, ApiError } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import {
  canManageBlog,
  estimateReadingTimeMinutes,
  resolveBlogEditorialSession,
  validateBlogPostInput,
} from "@/lib/blogs";

export default withApi(
  {
    methods: ["POST"],
    auth: true,
    scope: "blog-posts-create",
    limit: 15,
    windowMs: 600000,
  },
  async (req, res, session) => {
    const actor = await resolveBlogEditorialSession(session, User);
    requireCondition(
      actor?.canPublish,
      403,
      "Apenas os autores autorizados podem publicar artigos no Blog.",
    );
    requireCondition(
      !req.body?.authorId ||
        String(req.body.authorId) === String(actor.userId) ||
        String(req.body.authorId) === String(session.user.id),
      403,
      "Você não pode criar publicações em nome de outro autor.",
    );

    const blog = await Blog.findOne({ ownerId: actor.userId });
    requireCondition(
      blog,
      404,
      "Crie o seu blog pessoal antes de publicar um texto.",
    );
    requireCondition(
      canManageBlog(blog, actor.session),
      403,
      "Você só pode criar publicações no seu próprio blog.",
    );
    requireCondition(
      blog.status === "active",
      403,
      "Este blog não está ativo para novas publicações.",
    );

    const validation = validateBlogPostInput(req.body || {});
    requireCondition(validation.ok, 400, validation.error);

    const {
      title,
      subtitle,
      slug,
      category,
      content,
      status,
      coverImage,
      tags,
      featured,
    } = validation.value;

    await BlogPost.init();

    const existingSlug = await BlogPost.findOne({
      blogId: blog._id,
      slug,
    }).lean();
    if (existingSlug) {
      throw new ApiError(
        409,
        "Você já possui uma publicação com este título ou endereço no seu blog.",
      );
    }

    const now = new Date();
    try {
      if (featured && typeof BlogPost.updateMany === "function") {
        await BlogPost.updateMany(
          { blogId: blog._id, featured: true },
          { $set: { featured: false } },
        );
      }

      const created = await BlogPost.create({
        blogId: blog._id,
        authorId: actor.userId,
        title,
        subtitle,
        slug,
        category,
        content,
        coverImage: coverImage || "",
        tags: tags || [],
        featured: Boolean(featured),
        status,
        createdAt: now,
        updatedAt: now,
        publishedAt: status === "published" ? now : null,
      });

      blog.updatedAt = now;
      await blog.save();

      return res.status(201).json({
        post: {
          _id: String(created._id),
          blogId: String(created.blogId),
          authorId: String(created.authorId),
          title: created.title,
          subtitle: created.subtitle || "",
          slug: created.slug,
          category: created.category,
          content: created.content,
          coverImage: created.coverImage || "",
          tags: Array.isArray(created.tags) ? created.tags : [],
          featured: Boolean(created.featured),
          readingTimeMinutes: estimateReadingTimeMinutes(created.content),
          status: created.status,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          publishedAt: created.publishedAt,
        },
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError(
          409,
          "Já existe uma publicação com este endereço no seu blog.",
        );
      }
      throw error;
    }
  },
);
