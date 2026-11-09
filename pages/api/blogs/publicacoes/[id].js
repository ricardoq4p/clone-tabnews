import { withApi, requireCondition, ApiError } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import {
  canManageBlogPost,
  estimateReadingTimeMinutes,
  resolveBlogEditorialSession,
  validateBlogPostInput,
} from "@/lib/blogs";
import { isObjectId } from "@/lib/validation";

export default withApi(
  {
    methods: ["PATCH", "DELETE"],
    auth: true,
    scope: "blog-posts-manage",
    limit: 30,
    windowMs: 600000,
  },
  async (req, res, session) => {
    const actor = await resolveBlogEditorialSession(session, User);
    requireCondition(
      actor?.canPublish,
      403,
      "Apenas os autores autorizados podem editar ou excluir artigos do Blog.",
    );

    const postId = typeof req.query?.id === "string" ? req.query.id : "";
    requireCondition(isObjectId(postId), 400, "Publicação inválida.");

    const post = await BlogPost.findById(postId);
    requireCondition(post, 404, "Publicação não encontrada.");

    const blog = await Blog.findById(post.blogId);
    requireCondition(blog, 404, "Blog não encontrado.");
    requireCondition(
      canManageBlogPost(post, blog, actor.session),
      403,
      "Você não tem permissão para alterar ou excluir publicações de outro usuário.",
    );

    if (req.method === "DELETE") {
      await BlogPost.deleteOne(
        actor.isSuperAdmin
          ? {
              _id: post._id,
              blogId: blog._id,
            }
          : {
              _id: post._id,
              blogId: blog._id,
              authorId: actor.userId,
            },
      );
      blog.updatedAt = new Date();
      await blog.save();

      return res.status(200).json({
        message: "Publicação excluída com sucesso.",
      });
    }

    requireCondition(
      post.status !== "hidden" || actor.isSuperAdmin,
      409,
      "Esta publicação está indisponível por decisão da moderação.",
    );

    const action = req.body?.action;
    if (
      action === "publish" ||
      action === "unpublish" ||
      action === "feature" ||
      action === "unfeature"
    ) {
      const now = new Date();
      if (action === "publish" || action === "unpublish") {
        post.status = action === "publish" ? "published" : "draft";
        post.publishedAt =
          action === "publish" ? post.publishedAt || now : null;
      } else {
        const nextFeatured = action === "feature";
        if (nextFeatured && typeof BlogPost.updateMany === "function") {
          await BlogPost.updateMany(
            { blogId: blog._id, _id: { $ne: post._id }, featured: true },
            { $set: { featured: false } },
          );
        }
        post.featured = nextFeatured;
      }
      post.updatedAt = now;
      await post.save();

      blog.updatedAt = now;
      await blog.save();

      return res.status(200).json({
        post: {
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
        },
      });
    }

    const validation = validateBlogPostInput({
      title: req.body?.title ?? post.title,
      subtitle: req.body?.subtitle ?? post.subtitle,
      slug: req.body?.slug ?? post.title ?? post.slug,
      category: req.body?.category ?? post.category,
      content: req.body?.content ?? post.content,
      status: req.body?.status ?? post.status,
      coverImage: req.body?.coverImage ?? post.coverImage ?? "",
      tags: req.body?.tags ?? post.tags ?? [],
      featured: req.body?.featured ?? post.featured ?? false,
    });
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

    const duplicateSlug = await BlogPost.findOne({
      blogId: blog._id,
      slug,
      _id: { $ne: post._id },
    }).lean();
    if (duplicateSlug) {
      throw new ApiError(
        409,
        "Você já possui outra publicação com este título ou endereço no seu blog.",
      );
    }

    const now = new Date();
    if (featured && typeof BlogPost.updateMany === "function") {
      await BlogPost.updateMany(
        { blogId: blog._id, _id: { $ne: post._id }, featured: true },
        { $set: { featured: false } },
      );
    }
    post.title = title;
    post.subtitle = subtitle;
    post.slug = slug;
    post.category = category;
    post.content = content;
    post.coverImage = coverImage || "";
    post.tags = tags || [];
    post.featured = Boolean(featured);
    post.status = status;
    post.updatedAt = now;
    post.publishedAt = status === "published" ? post.publishedAt || now : null;

    try {
      await post.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError(
          409,
          "Já existe outra publicação com este endereço no seu blog.",
        );
      }
      throw error;
    }

    blog.updatedAt = now;
    await blog.save();

    return res.status(200).json({
      post: {
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
      },
    });
  },
);
