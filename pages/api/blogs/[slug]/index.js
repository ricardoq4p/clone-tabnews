import { withApi, requireCondition } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import {
  BLOG_CATEGORIES,
  BLOG_POSTS_PAGE_SIZE,
  canManageBlog,
  canReadPublicBlog,
  estimateReadingTimeMinutes,
  resolveBlogEditorialSession,
  sanitizePlainField,
  slugifyText,
  summarizeBlogPost,
} from "@/lib/blogs";
import { escapeRegex } from "@/lib/validation";

function formatPublicPostItem(post) {
  if (!post) return null;
  return {
    _id: String(post._id),
    title: post.title,
    subtitle: post.subtitle || "",
    slug: post.slug,
    category: post.category,
    coverImage: post.coverImage || "",
    tags: Array.isArray(post.tags) ? post.tags : [],
    featured: Boolean(post.featured),
    excerpt: summarizeBlogPost(post.content, 200),
    readingTimeMinutes: estimateReadingTimeMinutes(post.content),
    publishedAt: post.publishedAt || post.createdAt,
  };
}

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

    const searchQ = sanitizePlainField(req.query?.q || "");
    const categoryFilter =
      typeof req.query?.category === "string" &&
      BLOG_CATEGORIES.includes(req.query.category.trim())
        ? req.query.category.trim()
        : "";
    const tagFilter = sanitizePlainField(req.query?.tag || "");

    const filter = {
      blogId: blog._id,
      status: "published",
    };
    if (categoryFilter) {
      filter.category = categoryFilter;
    }
    if (tagFilter) {
      filter.tags = tagFilter;
    }
    if (searchQ) {
      const rx = new RegExp(escapeRegex(searchQ), "i");
      filter.$or = [
        { title: rx },
        { subtitle: rx },
        { content: rx },
        { tags: rx },
      ];
    }

    const [owner, total, posts, actor] = await Promise.all([
      User.findById(blog.ownerId).select("name avatar").lean(),
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

    const formattedPosts = (posts || []).map(formatPublicPostItem);
    const manualFeatured = formattedPosts.find((item) => item.featured);
    const featuredPost = manualFeatured || formattedPosts[0] || null;

    const availableCategories = Array.from(
      new Set(formattedPosts.map((item) => item.category).filter(Boolean)),
    );
    const availableTags = Array.from(
      new Set(
        formattedPosts.flatMap((item) => item.tags || []).filter(Boolean),
      ),
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      blog: {
        _id: String(blog._id),
        ownerId: String(blog.ownerId),
        name: blog.name,
        slug: blog.slug,
        description: blog.description,
        authorBio: blog.authorBio,
        coverImage: blog.coverImage || "",
        authorName: owner?.name || "Membro da comunidade",
        authorAvatar: owner?.avatar || "",
        isOwner: Boolean(actor && canManageBlog(blog, actor.session)),
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      },
      featuredPost,
      posts: formattedPosts,
      availableCategories,
      availableTags,
      page,
      totalPages,
      total,
    });
  },
);
