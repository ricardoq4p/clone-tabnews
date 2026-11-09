import { withApi, requireCondition } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import {
  canManageBlogPost,
  canReadPublicBlog,
  canReadPublicBlogPost,
  resolveBlogEditorialSession,
  slugifyText,
} from "@/lib/blogs";

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

    const [owner, actor] = await Promise.all([
      User.findById(blog.ownerId).select("name").lean(),
      session
        ? resolveBlogEditorialSession(session, User)
        : Promise.resolve(null),
    ]);

    return res.status(200).json({
      blog: {
        _id: String(blog._id),
        name: blog.name,
        slug: blog.slug,
        description: blog.description,
        authorBio: blog.authorBio,
        authorName: owner?.name || "Membro da comunidade",
        isOwner: Boolean(actor && canManageBlogPost(post, blog, actor.session)),
      },
      post: {
        _id: String(post._id),
        title: post.title,
        subtitle: post.subtitle || "",
        slug: post.slug,
        category: post.category,
        content: post.content,
        publishedAt: post.publishedAt || post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  },
);
