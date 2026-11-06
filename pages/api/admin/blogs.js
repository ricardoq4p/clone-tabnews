import { withApi, requireCondition } from "@/lib/api";
import Blog from "@/lib/models/Blog";
import BlogPost from "@/lib/models/BlogPost";
import User from "@/lib/models/User";
import AbuseReport from "@/lib/models/AbuseReport";
import ModerationLog from "@/lib/models/ModerationLog";
import { escapeRegex, isObjectId, validText } from "@/lib/validation";

const PAGE_SIZE = 20;

async function computeSummaryStats() {
  const [
    totalBlogs,
    activeBlogs,
    hiddenBlogs,
    totalPosts,
    publishedPosts,
    draftPosts,
    hiddenPosts,
    pendingReports,
  ] = await Promise.all([
    Blog.countDocuments({}),
    Blog.countDocuments({ status: "active" }),
    Blog.countDocuments({ status: "hidden" }),
    BlogPost.countDocuments({}),
    BlogPost.countDocuments({ status: "published" }),
    BlogPost.countDocuments({ status: "draft" }),
    BlogPost.countDocuments({ status: "hidden" }),
    AbuseReport.countDocuments({ targetType: "blog_post", status: "pending" }),
  ]);

  return {
    totalBlogs,
    activeBlogs,
    hiddenBlogs,
    totalPosts,
    publishedPosts,
    draftPosts,
    hiddenPosts,
    pendingReports,
  };
}

export default withApi(
  {
    methods: ["GET", "PATCH"],
    admin: true,
    scope: "admin-blogs",
    limit: 60,
  },
  async (req, res, session) => {
    if (req.method === "GET") {
      const {
        view = "blogs",
        q = "",
        status = "",
        page = "1",
        blogId = "",
        postId = "",
        targetType = "",
        targetId = "",
        reason = "",
      } = req.query || {};

      requireCondition(
        ["blogs", "posts", "reports", "detail"].includes(view) &&
          typeof q === "string" &&
          q.length <= 80 &&
          typeof status === "string" &&
          typeof page === "string" &&
          /^[1-9]\d{0,5}$/.test(page) &&
          (!blogId || isObjectId(blogId)) &&
          (!postId || isObjectId(postId)),
        400,
        "Filtros inválidos.",
      );

      if (view === "detail") {
        requireCondition(
          ["blog", "blog_post"].includes(targetType) && isObjectId(targetId),
          400,
          "Identificador inválido para consulta detalhada.",
        );

        const auditReason =
          typeof reason === "string" && reason.trim()
            ? reason.trim().slice(0, 500)
            : "Consulta administrativa na aba Blogs";

        await ModerationLog.create({
          actorId: session.user.id,
          action: targetType === "blog" ? "inspect-blog" : "review-blog-post",
          targetType,
          targetId,
          reason: auditReason,
        });

        if (targetType === "blog") {
          const blog = await Blog.findById(targetId).lean();
          requireCondition(blog, 404, "Blog não encontrado.");

          const [owner, posts] = await Promise.all([
            User.findById(blog.ownerId).select("name email").lean(),
            BlogPost.find({ blogId: blog._id })
              .sort({ updatedAt: -1, _id: -1 })
              .lean(),
          ]);

          const postIds = posts.map((post) => post._id);
          const postIdStrings = posts.map((post) => String(post._id));

          const [reports, logs] = await Promise.all([
            postIds.length
              ? AbuseReport.find({
                  targetType: "blog_post",
                  targetId: { $in: postIds },
                })
                  .sort({ _id: -1 })
                  .lean()
              : Promise.resolve([]),
            ModerationLog.find({
              $or: [
                { targetType: "blog", targetId: String(blog._id) },
                ...(postIdStrings.length
                  ? [
                      {
                        targetType: "blog_post",
                        targetId: { $in: postIdStrings },
                      },
                    ]
                  : []),
              ],
            })
              .sort({ createdAt: -1, _id: -1 })
              .limit(40)
              .lean(),
          ]);

          const actorIds = [
            ...new Set(
              logs.map((entry) => String(entry.actorId)).filter(Boolean),
            ),
          ];
          const actors = actorIds.length
            ? await User.find({ _id: { $in: actorIds } })
                .select("name email")
                .lean()
            : [];
          const actorMap = new Map(
            actors.map((actor) => [
              String(actor._id),
              actor.name || actor.email,
            ]),
          );

          const postReportCounts = new Map();
          for (const report of reports) {
            const key = String(report.targetId);
            const current = postReportCounts.get(key) || {
              pending: 0,
              total: 0,
            };
            current.total += 1;
            if (report.status === "pending") current.pending += 1;
            postReportCounts.set(key, current);
          }

          return res.status(200).json({
            targetType: "blog",
            blog: {
              _id: String(blog._id),
              name: blog.name,
              slug: blog.slug,
              description: blog.description,
              authorBio: blog.authorBio,
              status: blog.status,
              ownerId: String(blog.ownerId),
              ownerName: owner?.name || "Participante indisponível",
              ownerEmail: owner?.email || "",
              createdAt: blog.createdAt,
              updatedAt: blog.updatedAt,
            },
            posts: posts.map((post) => {
              const counts = postReportCounts.get(String(post._id)) || {
                pending: 0,
                total: 0,
              };
              return {
                _id: String(post._id),
                title: post.title,
                subtitle: post.subtitle || "",
                slug: post.slug,
                category: post.category,
                status: post.status,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                publishedAt: post.publishedAt,
                pendingReportsCount: counts.pending,
                totalReportsCount: counts.total,
              };
            }),
            reports: reports.map((report) => ({
              _id: String(report._id),
              targetId: String(report.targetId),
              reason: report.reason,
              details: report.details || "",
              status: report.status,
              createdAt: report.createdAt,
            })),
            history: logs.map((entry) => ({
              _id: String(entry._id),
              actorId: String(entry.actorId),
              actorName: actorMap.get(String(entry.actorId)) || "Administrador",
              action: entry.action,
              targetType: entry.targetType,
              targetId: entry.targetId,
              reason: entry.reason,
              createdAt: entry.createdAt,
            })),
          });
        }

        const post = await BlogPost.findById(targetId).lean();
        requireCondition(post, 404, "Publicação não encontrada.");

        const [blog, author, reports, logs] = await Promise.all([
          Blog.findById(post.blogId).lean(),
          User.findById(post.authorId).select("name email").lean(),
          AbuseReport.find({
            targetType: "blog_post",
            targetId: post._id,
          })
            .sort({ _id: -1 })
            .lean(),
          ModerationLog.find({
            targetType: "blog_post",
            targetId: String(post._id),
          })
            .sort({ createdAt: -1, _id: -1 })
            .limit(40)
            .lean(),
        ]);

        const actorIds = [
          ...new Set(
            logs.map((entry) => String(entry.actorId)).filter(Boolean),
          ),
        ];
        const actors = actorIds.length
          ? await User.find({ _id: { $in: actorIds } })
              .select("name email")
              .lean()
          : [];
        const actorMap = new Map(
          actors.map((actor) => [String(actor._id), actor.name || actor.email]),
        );

        return res.status(200).json({
          targetType: "blog_post",
          post: {
            _id: String(post._id),
            blogId: String(post.blogId),
            blogName: blog?.name || "Blog indisponível",
            blogSlug: blog?.slug || "",
            blogStatus: blog?.status || "hidden",
            authorId: String(post.authorId),
            authorName: author?.name || "Participante indisponível",
            authorEmail: author?.email || "",
            title: post.title,
            subtitle: post.subtitle || "",
            slug: post.slug,
            category: post.category,
            status: post.status,
            content: post.status === "draft" ? null : post.content,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            publishedAt: post.publishedAt,
          },
          reports: reports.map((report) => ({
            _id: String(report._id),
            targetId: String(report.targetId),
            reason: report.reason,
            details: report.details || "",
            status: report.status,
            createdAt: report.createdAt,
          })),
          history: logs.map((entry) => ({
            _id: String(entry._id),
            actorId: String(entry.actorId),
            actorName: actorMap.get(String(entry.actorId)) || "Administrador",
            action: entry.action,
            targetType: entry.targetType,
            targetId: entry.targetId,
            reason: entry.reason,
            createdAt: entry.createdAt,
          })),
        });
      }

      const pageNumber = Number(page);
      const skip = (pageNumber - 1) * PAGE_SIZE;

      if (view === "blogs") {
        requireCondition(
          ["", "active", "hidden", "reported"].includes(status),
          400,
          "Filtro de situação de blog inválido.",
        );

        const filter = {};
        if (status === "active" || status === "hidden") {
          filter.status = status;
        }

        const trimmedQuery = q.trim();
        if (trimmedQuery) {
          const regex = { $regex: escapeRegex(trimmedQuery), $options: "i" };
          const matchingOwners = await User.find({ name: regex })
            .select("_id")
            .lean();
          const ownerIds = matchingOwners.map((user) => user._id);
          filter.$or = [
            { name: regex },
            { slug: regex },
            ...(ownerIds.length ? [{ ownerId: { $in: ownerIds } }] : []),
          ];
        }

        if (status === "reported") {
          const pendingReports = await AbuseReport.find({
            targetType: "blog_post",
            status: "pending",
          })
            .select("targetId")
            .lean();
          const reportedPostIds = pendingReports.map((r) => r.targetId);
          const reportedPosts = reportedPostIds.length
            ? await BlogPost.find({ _id: { $in: reportedPostIds } })
                .select("blogId")
                .lean()
            : [];
          const reportedBlogIds = [
            ...new Set(reportedPosts.map((p) => p.blogId)),
          ];
          filter._id = { $in: reportedBlogIds };
        }

        const [stats, filtered, blogs] = await Promise.all([
          computeSummaryStats(),
          Blog.countDocuments(filter),
          Blog.find(filter)
            .sort({ updatedAt: -1, _id: -1 })
            .skip(skip)
            .limit(PAGE_SIZE)
            .lean(),
        ]);

        const blogIds = blogs.map((b) => b._id);
        const ownerIds = blogs.map((b) => b.ownerId);

        const [owners, posts] = await Promise.all([
          ownerIds.length
            ? User.find({ _id: { $in: ownerIds } })
                .select("name email")
                .lean()
            : Promise.resolve([]),
          blogIds.length
            ? BlogPost.find({ blogId: { $in: blogIds } })
                .select("_id blogId status updatedAt publishedAt")
                .lean()
            : Promise.resolve([]),
        ]);

        const postIds = posts.map((p) => p._id);
        const reports = postIds.length
          ? await AbuseReport.find({
              targetType: "blog_post",
              targetId: { $in: postIds },
            })
              .select("targetId status")
              .lean()
          : [];

        const postToBlogMap = new Map(
          posts.map((p) => [String(p._id), String(p.blogId)]),
        );
        const blogReportStats = new Map();
        for (const report of reports) {
          const bId = postToBlogMap.get(String(report.targetId));
          if (!bId) continue;
          const current = blogReportStats.get(bId) || {
            pending: 0,
            total: 0,
          };
          current.total += 1;
          if (report.status === "pending") current.pending += 1;
          blogReportStats.set(bId, current);
        }

        const blogPostStats = new Map();
        for (const post of posts) {
          const bId = String(post.blogId);
          const current = blogPostStats.get(bId) || {
            total: 0,
            published: 0,
            draft: 0,
            hidden: 0,
            lastActivityAt: null,
          };
          current.total += 1;
          if (post.status === "published") current.published += 1;
          else if (post.status === "draft") current.draft += 1;
          else if (post.status === "hidden") current.hidden += 1;

          const activityCandidate = post.updatedAt || post.publishedAt;
          if (
            activityCandidate &&
            (!current.lastActivityAt ||
              new Date(activityCandidate) > new Date(current.lastActivityAt))
          ) {
            current.lastActivityAt = activityCandidate;
          }
          blogPostStats.set(bId, current);
        }

        const ownerMap = new Map(
          owners.map((user) => [
            String(user._id),
            { name: user.name || "Participante", email: user.email || "" },
          ]),
        );

        const items = blogs.map((blog) => {
          const bId = String(blog._id);
          const owner = ownerMap.get(String(blog.ownerId)) || {
            name: "Participante indisponível",
            email: "",
          };
          const pStats = blogPostStats.get(bId) || {
            total: 0,
            published: 0,
            draft: 0,
            hidden: 0,
            lastActivityAt: null,
          };
          const rStats = blogReportStats.get(bId) || {
            pending: 0,
            total: 0,
          };
          const lastActivityAt =
            pStats.lastActivityAt &&
            new Date(pStats.lastActivityAt) > new Date(blog.updatedAt)
              ? pStats.lastActivityAt
              : blog.updatedAt || blog.createdAt;

          return {
            _id: bId,
            name: blog.name,
            slug: blog.slug,
            description: blog.description,
            status: blog.status,
            ownerId: String(blog.ownerId),
            ownerName: owner.name,
            ownerEmail: owner.email,
            postsCount: pStats.total,
            publishedCount: pStats.published,
            draftCount: pStats.draft,
            hiddenCount: pStats.hidden,
            pendingReportsCount: rStats.pending,
            totalReportsCount: rStats.total,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
            lastActivityAt,
          };
        });

        return res.status(200).json({
          stats,
          items,
          filtered,
          page: pageNumber,
          pages: Math.max(1, Math.ceil(filtered / PAGE_SIZE)),
        });
      }

      if (view === "posts") {
        requireCondition(
          ["", "published", "draft", "hidden", "reported"].includes(status),
          400,
          "Filtro de situação de publicação inválido.",
        );

        const filter = {};
        if (blogId) {
          filter.blogId = blogId;
        }
        if (["published", "draft", "hidden"].includes(status)) {
          filter.status = status;
        }

        if (status === "reported") {
          const pendingReports = await AbuseReport.find({
            targetType: "blog_post",
            status: "pending",
          })
            .select("targetId")
            .lean();
          filter._id = { $in: pendingReports.map((r) => r.targetId) };
        }

        const trimmedQuery = q.trim();
        if (trimmedQuery) {
          const regex = { $regex: escapeRegex(trimmedQuery), $options: "i" };
          const [matchingBlogs, matchingAuthors] = await Promise.all([
            Blog.find({ $or: [{ name: regex }, { slug: regex }] })
              .select("_id")
              .lean(),
            User.find({ name: regex }).select("_id").lean(),
          ]);
          const matchedBlogIds = matchingBlogs.map((b) => b._id);
          const matchedAuthorIds = matchingAuthors.map((u) => u._id);

          filter.$or = [
            { title: regex },
            { category: regex },
            ...(matchedBlogIds.length
              ? [{ blogId: { $in: matchedBlogIds } }]
              : []),
            ...(matchedAuthorIds.length
              ? [{ authorId: { $in: matchedAuthorIds } }]
              : []),
          ];
        }

        const [stats, filtered, posts] = await Promise.all([
          computeSummaryStats(),
          BlogPost.countDocuments(filter),
          BlogPost.find(filter)
            .sort({ updatedAt: -1, _id: -1 })
            .skip(skip)
            .limit(PAGE_SIZE)
            .lean(),
        ]);

        const postIds = posts.map((p) => p._id);
        const blogIds = [...new Set(posts.map((p) => p.blogId))];
        const authorIds = [...new Set(posts.map((p) => p.authorId))];

        const [blogs, authors, reports] = await Promise.all([
          blogIds.length
            ? Blog.find({ _id: { $in: blogIds } })
                .select("name slug status")
                .lean()
            : Promise.resolve([]),
          authorIds.length
            ? User.find({ _id: { $in: authorIds } })
                .select("name email")
                .lean()
            : Promise.resolve([]),
          postIds.length
            ? AbuseReport.find({
                targetType: "blog_post",
                targetId: { $in: postIds },
              })
                .select("targetId status")
                .lean()
            : Promise.resolve([]),
        ]);

        const blogMap = new Map(
          blogs.map((b) => [
            String(b._id),
            { name: b.name, slug: b.slug, status: b.status },
          ]),
        );
        const authorMap = new Map(
          authors.map((u) => [String(u._id), u.name || "Participante"]),
        );
        const reportMap = new Map();
        for (const report of reports) {
          const pId = String(report.targetId);
          const current = reportMap.get(pId) || { pending: 0, total: 0 };
          current.total += 1;
          if (report.status === "pending") current.pending += 1;
          reportMap.set(pId, current);
        }

        const items = posts.map((post) => {
          const pId = String(post._id);
          const blog = blogMap.get(String(post.blogId)) || {
            name: "Blog indisponível",
            slug: "",
            status: "hidden",
          };
          const rStats = reportMap.get(pId) || { pending: 0, total: 0 };

          return {
            _id: pId,
            blogId: String(post.blogId),
            blogName: blog.name,
            blogSlug: blog.slug,
            blogStatus: blog.status,
            authorId: String(post.authorId),
            authorName:
              authorMap.get(String(post.authorId)) ||
              "Participante indisponível",
            title: post.title,
            subtitle: post.subtitle || "",
            slug: post.slug,
            category: post.category,
            status: post.status,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            publishedAt: post.publishedAt,
            pendingReportsCount: rStats.pending,
            totalReportsCount: rStats.total,
          };
        });

        return res.status(200).json({
          stats,
          items,
          filtered,
          page: pageNumber,
          pages: Math.max(1, Math.ceil(filtered / PAGE_SIZE)),
        });
      }

      // view === "reports"
      requireCondition(
        ["", "pending", "resolved", "dismissed"].includes(status),
        400,
        "Filtro de denúncia inválido.",
      );

      const reportFilter = { targetType: "blog_post" };
      if (status) {
        reportFilter.status = status;
      }
      if (postId) {
        reportFilter.targetId = postId;
      } else if (blogId) {
        const blogPosts = await BlogPost.find({ blogId }).select("_id").lean();
        reportFilter.targetId = { $in: blogPosts.map((p) => p._id) };
      }

      const [stats, filtered, reports] = await Promise.all([
        computeSummaryStats(),
        AbuseReport.countDocuments(reportFilter),
        AbuseReport.find(reportFilter)
          .sort({ _id: -1 })
          .skip(skip)
          .limit(PAGE_SIZE)
          .lean(),
      ]);

      const postIds = [...new Set(reports.map((r) => r.targetId))];
      const posts = postIds.length
        ? await BlogPost.find({ _id: { $in: postIds } }).lean()
        : [];
      const blogIds = [...new Set(posts.map((p) => p.blogId))];
      const authorIds = [...new Set(posts.map((p) => p.authorId))];

      const [blogs, authors] = await Promise.all([
        blogIds.length
          ? Blog.find({ _id: { $in: blogIds } })
              .select("name slug status")
              .lean()
          : Promise.resolve([]),
        authorIds.length
          ? User.find({ _id: { $in: authorIds } })
              .select("name")
              .lean()
          : Promise.resolve([]),
      ]);

      const postMap = new Map(posts.map((p) => [String(p._id), p]));
      const blogMap = new Map(blogs.map((b) => [String(b._id), b]));
      const authorMap = new Map(authors.map((u) => [String(u._id), u.name]));

      const items = reports.map((report) => {
        const post = postMap.get(String(report.targetId));
        const blog = post ? blogMap.get(String(post.blogId)) : null;
        return {
          _id: String(report._id),
          targetId: String(report.targetId),
          reason: report.reason,
          details: report.details || "",
          status: report.status,
          createdAt: report.createdAt,
          postTitle: post?.title || "Publicação indisponível",
          postSlug: post?.slug || "",
          postStatus: post?.status || "hidden",
          postCategory: post?.category || "",
          blogId: post ? String(post.blogId) : "",
          blogName: blog?.name || "Blog indisponível",
          blogSlug: blog?.slug || "",
          blogStatus: blog?.status || "hidden",
          authorName: post
            ? authorMap.get(String(post.authorId)) || "Participante"
            : "Participante",
        };
      });

      return res.status(200).json({
        stats,
        items,
        filtered,
        page: pageNumber,
        pages: Math.max(1, Math.ceil(filtered / PAGE_SIZE)),
      });
    }

    // PATCH — Administrative Moderation Actions
    const { targetType, targetId, action, reason } = req.body || {};
    requireCondition(
      ["blog", "blog_post", "report"].includes(targetType) &&
        isObjectId(targetId) &&
        typeof action === "string" &&
        validText(reason, 500),
      400,
      "Informe o registro, a ação administrativa e o motivo da decisão.",
    );

    const trimmedReason = reason.trim();

    if (targetType === "blog") {
      requireCondition(
        ["disable", "enable"].includes(action),
        400,
        "Ação inválida para blog.",
      );

      const blog = await Blog.findById(targetId).lean();
      requireCondition(blog, 404, "Blog não encontrado.");

      const nextStatus = action === "disable" ? "hidden" : "active";

      await ModerationLog.create({
        actorId: session.user.id,
        action: action === "disable" ? "disable-blog" : "enable-blog",
        targetType: "blog",
        targetId: String(blog._id),
        reason: trimmedReason,
      });

      await Blog.updateOne({ _id: blog._id }, { $set: { status: nextStatus } });

      return res.status(200).json({
        status: nextStatus,
        message:
          action === "disable"
            ? "Blog desativado. O conteúdo deixou de aparecer publicamente e todas as publicações foram preservadas."
            : "Blog reativado. As publicações publicadas voltaram a ficar disponíveis.",
      });
    }

    if (targetType === "blog_post") {
      requireCondition(
        ["hide", "restore"].includes(action),
        400,
        "Ação inválida para publicação.",
      );

      const post = await BlogPost.findById(targetId).lean();
      requireCondition(post, 404, "Publicação não encontrada.");

      requireCondition(
        post.status !== "draft",
        409,
        "Um rascunho privado do autor não pode ser publicado ou moderado como público.",
      );

      if (action === "restore") {
        requireCondition(
          post.status === "hidden",
          409,
          "Apenas publicações despublicadas pela moderação podem ser restauradas.",
        );
      }

      const nextStatus = action === "hide" ? "hidden" : "published";

      await ModerationLog.create({
        actorId: session.user.id,
        action: action === "hide" ? "hide-blog-post" : "restore-blog-post",
        targetType: "blog_post",
        targetId: String(post._id),
        reason: trimmedReason,
      });

      await BlogPost.updateOne(
        { _id: post._id },
        { $set: { status: nextStatus } },
      );

      if (action === "hide") {
        await AbuseReport.updateMany(
          { targetType: "blog_post", targetId: post._id, status: "pending" },
          { $set: { status: "resolved" } },
        );
      }

      return res.status(200).json({
        status: nextStatus,
        message:
          action === "hide"
            ? "Publicação despublicada pela moderação. O texto original do autor foi preservado."
            : "Publicação restaurada com sucesso.",
      });
    }

    // targetType === "report"
    requireCondition(
      ["resolve", "dismiss"].includes(action),
      400,
      "Ação inválida para denúncia.",
    );

    const report = await AbuseReport.findOne({
      _id: targetId,
      targetType: "blog_post",
    }).lean();
    requireCondition(report, 404, "Denúncia não encontrada.");

    const nextStatus = action === "dismiss" ? "dismissed" : "resolved";

    await ModerationLog.create({
      actorId: session.user.id,
      action:
        action === "dismiss" ? "dismiss-blog-report" : "resolve-blog-report",
      targetType: "blog_post",
      targetId: String(report.targetId),
      reason: trimmedReason,
    });

    await AbuseReport.updateOne(
      { _id: report._id },
      { $set: { status: nextStatus } },
    );

    return res.status(200).json({
      status: nextStatus,
      message:
        action === "dismiss"
          ? "Denúncia marcada como improcedente e registrada na auditoria."
          : "Denúncia marcada como resolvida e registrada na auditoria.",
    });
  },
);
