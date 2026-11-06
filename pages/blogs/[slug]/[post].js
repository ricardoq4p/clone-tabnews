import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import ReportButton from "@/components/prayer/ReportButton";
import BlogContentRenderer from "@/components/prayer/BlogContentRenderer";
import { requestJson, formatPrayerDate } from "@/lib/client";
import { BLOG_INSTITUTIONAL_DISCLAIMER, summarizeBlogPost } from "@/lib/blogs";

export default function PublicBlogPostPage({
  initialBlog = null,
  initialPost = null,
  initialLoaded = false,
}) {
  const router = useRouter();
  const blogSlug =
    typeof router.query?.slug === "string"
      ? router.query.slug
      : initialBlog?.slug || "";
  const postSlug =
    typeof router.query?.post === "string"
      ? router.query.post
      : initialPost?.slug || "";

  const [blog, setBlog] = useState(initialBlog);
  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialLoaded);
  const [error, setError] = useState("");

  const loadArticle = useCallback(() => {
    if (!blogSlug || !postSlug) return Promise.resolve();
    return requestJson(
      `/api/blogs/${encodeURIComponent(blogSlug)}/${encodeURIComponent(postSlug)}`,
    )
      .then((result) => {
        setError("");
        setBlog(result.blog);
        setPost(result.post);
      })
      .catch((err) => {
        setError(err?.message || "Esta publicação não está disponível.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [blogSlug, postSlug]);

  useEffect(() => {
    if (initialLoaded || !blogSlug || !postSlug) return;
    loadArticle();
  }, [blogSlug, postSlug, initialLoaded, loadArticle]);

  const seoTitle =
    post && blog
      ? `${post.title} — ${blog.name} | Caminhar para Cristo`
      : "Publicação | Caminhar para Cristo";
  const seoDescription = post
    ? post.subtitle || summarizeBlogPost(post.content, 160)
    : "Leitura e reflexão na comunidade Caminhar para Cristo.";

  return (
    <PrayerLayout title={seoTitle} description={seoDescription}>
      <div className="p-container pl-blogs-page pl-blog-article-page">
        <div className="p-page-head pl-blog-article-head">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/blogs">Blogs</Link>
            <span>/</span>
            {blog ? (
              <Link href={`/blogs/${blog.slug}`}>{blog.name}</Link>
            ) : (
              <span>Blog</span>
            )}
            <span>/</span>
            {post?.title || "Artigo"}
          </div>
        </div>

        {loading && !post ? (
          <p className="p-loading" role="status">
            Carregando publicação…
          </p>
        ) : error || !post || !blog ? (
          <div className="p-panel p-empty">
            <h2>Publicação indisponível</h2>
            <p>
              {error ||
                "Este artigo não existe ou ainda não foi publicado pelo autor."}
            </p>
            <Link
              href={blogSlug ? `/blogs/${blogSlug}` : "/blogs"}
              className="p-button p-button-outline"
            >
              <Icon name="back" size={16} />
              Voltar ao blog
            </Link>
          </div>
        ) : (
          <article className="p-panel pl-blog-article-card">
            <header className="pl-blog-article-header">
              <div className="pl-blog-article-meta">
                <Link
                  href={`/blogs/${blog.slug}`}
                  className="pl-blog-origin-link"
                >
                  {blog.name}
                </Link>
                <span>·</span>
                <span className="pl-post-category-pill">{post.category}</span>
                {post.publishedAt ? (
                  <>
                    <span>·</span>
                    <time dateTime={String(post.publishedAt)}>
                      {formatPrayerDate(post.publishedAt, { year: "numeric" })}
                    </time>
                  </>
                ) : null}
              </div>

              <h1>{post.title}</h1>
              {post.subtitle ? (
                <p className="pl-blog-article-subtitle">{post.subtitle}</p>
              ) : null}

              <p className="pl-blog-article-byline">
                Por <strong>{blog.authorName}</strong>
              </p>
            </header>

            <BlogContentRenderer content={post.content} />

            <footer className="pl-blog-article-footer">
              <div className="pl-blog-author-inline">
                <span className="p-eyebrow">SOBRE O AUTOR</span>
                <p>
                  <strong>{blog.authorName}</strong> — {blog.authorBio}
                </p>
              </div>

              <div className="pl-blog-article-moderation">
                <ReportButton targetType="blog_post" targetId={post._id} />
              </div>
            </footer>
          </article>
        )}

        {blog ? (
          <div className="pl-daily-prayer-return">
            <Link
              href={`/blogs/${blog.slug}`}
              className="p-button p-button-outline"
            >
              <Icon name="back" size={16} />
              Voltar para {blog.name}
            </Link>
          </div>
        ) : null}

        <footer className="pl-blogs-disclaimer" role="note">
          <Icon name="cross" size={15} />
          <p>{BLOG_INSTITUTIONAL_DISCLAIMER}</p>
        </footer>
      </div>
    </PrayerLayout>
  );
}
