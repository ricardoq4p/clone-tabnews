import { withApi, requireCondition } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import {
  BLOG_POSTS_PAGE_SIZE,
  canManageBlog,
  canReadPublicBlog,
  resolveBlogEditorialSession,
  slugifyText,
  summarizeBlogPost,
} from "@/lib/blogs";

export default withApi(
  {
    methods: ["GET"],
  },
  async (req, res, session) => {
    const slug = slugifyText(req.query?.slug || "", 60);
    requireCondition(Boolean(slug), 404, "Blog não encontrado.");

    const blog = await Blog.findOne({ slug }).lean();
    requireCondition(
      canReadPublicBlog(blog),
      404,
      "Este blog não está disponível.",
    );

    const rawPage = Number.parseInt(String(req.query?.page || "1"), 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = BLOG_POSTS_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const filter = {
      blogId: blog._id,
      status: "published",
    };

    const [owner, total, posts, actor] = await Promise.all([
      User.findById(blog.ownerId).select("name").lean(),
      BlogPost.countDocuments(filter),
      BlogPost.find(filter)
        .sort({ publishedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      session
        ? resolveBlogEditorialSession(session, User)
        : Promise.resolve(null),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      blog: {
        _id: String(blog._id),
        ownerId: String(blog.ownerId),
        name: blog.name,
        slug: blog.slug,
        description: blog.description,
        authorBio: blog.authorBio,
        authorName: owner?.name || "Membro da comunidade",
        isOwner: Boolean(actor && canManageBlog(blog, actor.session)),
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      },
      posts: posts.map((post) => ({
        _id: String(post._id),
        title: post.title,
        subtitle: post.subtitle || "",
        slug: post.slug,
        category: post.category,
        excerpt: summarizeBlogPost(post.content, 200),
        publishedAt: post.publishedAt || post.createdAt,
      })),
      page,
      totalPages,
      total,
    });
  },
);
