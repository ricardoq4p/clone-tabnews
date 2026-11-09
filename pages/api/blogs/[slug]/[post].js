import { withApi, requireCondition } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import {
  canManageBlogPost,
  canReadPublicBlog,
  canReadPublicBlogPost,
  estimateReadingTimeMinutes,
  extractBlogHeadings,
  resolveBlogEditorialSession,
  slugifyText,
  summarizeBlogPost,
} from "@/lib/blogs";

async function safeFindRelatedPosts(blogId, currentPost) {
  try {
    if (!BlogPost || typeof BlogPost.find !== "function") return [];
    const query = BlogPost.find({
      blogId,
      status: "published",
      _id: { $ne: currentPost._id },
    });
    if (!query) return [];
    const sorted =
      typeof query.sort === "function"
        ? query.sort({ publishedAt: -1, _id: -1 })
        : query;
    const limited =
      typeof sorted.limit === "function" ? sorted.limit(6) : sorted;
    const candidates =
      typeof limited.lean === "function" ? await limited.lean() : await limited;
    if (!Array.isArray(candidates)) return [];

    const currentTags = new Set(currentPost.tags || []);
    return candidates
      .map((item) => {
        const sharedTags = (item.tags || []).filter((t) =>
          currentTags.has(t),
        ).length;
        const sameCategory = item.category === currentPost.category ? 1 : 0;
        return {
          score: sameCategory * 2 + sharedTags,
          item,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ item }) => ({
        _id: String(item._id),
        title: item.title,
        subtitle: item.subtitle || "",
        slug: item.slug,
        category: item.category,
        coverImage: item.coverImage || "",
        tags: Array.isArray(item.tags) ? item.tags : [],
        excerpt: summarizeBlogPost(item.content, 140),
        readingTimeMinutes: estimateReadingTimeMinutes(item.content),
        publishedAt: item.publishedAt || item.createdAt,
      }));
  } catch {
    return [];
  }
}

export default withApi(
  {
    methods: ["GET"],
  },
  async (req, res, session) => {
    const blogSlug = slugifyText(req.query?.slug || "", 60);
    const postSlug = slugifyText(req.query?.post || "", 120);
    requireCondition(
      Boolean(blogSlug && postSlug),
      404,
      "Publicação não encontrada.",
    );

    const blog = await Blog.findOne({ slug: blogSlug }).lean();
    requireCondition(
      canReadPublicBlog(blog),
      404,
      "Publicação não encontrada.",
    );

    const post = await BlogPost.findOne({
      blogId: blog._id,
      slug: postSlug,
    }).lean();

    requireCondition(
      canReadPublicBlogPost(post, blog),
      404,
      "Esta publicação não está disponível.",
    );

    const [owner, actor, relatedPosts] = await Promise.all([
      User.findById(blog.ownerId).select("name avatar").lean(),
      session
        ? resolveBlogEditorialSession(session, User)
        : Promise.resolve(null),
      safeFindRelatedPosts(blog._id, post),
    ]);

    return res.status(200).json({
      blog: {
        _id: String(blog._id),
        name: blog.name,
        slug: blog.slug,
        description: blog.description,
        authorBio: blog.authorBio,
        coverImage: blog.coverImage || "",
        authorName: owner?.name || "Membro da comunidade",
        authorAvatar: owner?.avatar || "",
        isOwner: Boolean(actor && canManageBlogPost(post, blog, actor.session)),
      },
      post: {
        _id: String(post._id),
        title: post.title,
        subtitle: post.subtitle || "",
        slug: post.slug,
        category: post.category,
        content: post.content,
        coverImage: post.coverImage || "",
        tags: Array.isArray(post.tags) ? post.tags : [],
        featured: Boolean(post.featured),
        readingTimeMinutes: estimateReadingTimeMinutes(post.content),
        headings: extractBlogHeadings(post.content),
        publishedAt: post.publishedAt || post.createdAt,
        updatedAt: post.updatedAt,
      },
      relatedPosts,
    });
  },
);
