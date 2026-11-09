import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import ReportButton from "@/components/prayer/ReportButton";
import BlogContentRenderer from "@/components/prayer/BlogContentRenderer";
import { requestJson, formatPrayerDate } from "@/lib/client";
import {
  BLOG_INSTITUTIONAL_DISCLAIMER,
  DEFAULT_AUTHOR_AVATAR,
  DEFAULT_BLOG_COVER_IMAGE,
  estimateReadingTimeMinutes,
  extractBlogHeadings,
  shouldShowBlogTableOfContents,
  summarizeBlogPost,
} from "@/lib/blogs";

export default function PublicBlogPostPage({
  initialBlog = null,
  initialPost = null,
  initialRelatedPosts = [],
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
  const [relatedPosts, setRelatedPosts] = useState(initialRelatedPosts);
  const [loading, setLoading] = useState(!initialLoaded);
  const [error, setError] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function updateReadingProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setReadingProgress(100);
        return;
      }
      const next = Math.min(
        100,
        Math.max(0, Math.round((scrollTop / docHeight) * 100)),
      );
      setReadingProgress(next);
    }

    updateReadingProgress();
    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);
    return () => {
      window.removeEventListener("scroll", updateReadingProgress);
      window.removeEventListener("resize", updateReadingProgress);
    };
  }, [post]);

  async function handleShareArticle() {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    const shareTitle = post?.title || "Artigo — Blog Caminhar para Cristo";
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
        setShareFeedback("Link compartilhado.");
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback("Link copiado para compartilhar.");
        return;
      }
    } catch {
      /* ignore share cancellation */
    }
  }

  const loadArticle = useCallback(() => {
    if (!blogSlug || !postSlug) return Promise.resolve();
    return requestJson(
      `/api/blogs/${encodeURIComponent(blogSlug)}/${encodeURIComponent(postSlug)}`,
    )
      .then((result) => {
        setError("");
        setBlog(result.blog);
        setPost(result.post);
        setRelatedPosts(
          Array.isArray(result.relatedPosts) ? result.relatedPosts : [],
        );
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

  const headings = useMemo(() => {
    if (!post) return [];
    if (Array.isArray(post.headings) && post.headings.length > 0) {
      return post.headings;
    }
    return extractBlogHeadings(post.content || "");
  }, [post]);

  const showToc = shouldShowBlogTableOfContents(headings);
  const readingMinutes = useMemo(() => {
    if (!post) return 1;
    return (
      post.readingTimeMinutes || estimateReadingTimeMinutes(post.content || "")
    );
  }, [post]);

  const seoTitle =
    post && blog
      ? `${post.title} — ${blog.name} | Caminhar para Cristo`
      : "Publicação | Caminhar para Cristo";
  const seoDescription = post
    ? post.subtitle || summarizeBlogPost(post.content, 160)
    : "Leitura e reflexão na comunidade Caminhar para Cristo.";
  const coverUrl =
    post?.coverImage || blog?.coverImage || DEFAULT_BLOG_COVER_IMAGE;
  const authorAvatarUrl = blog?.authorAvatar || DEFAULT_AUTHOR_AVATAR;

  return (
    <PrayerLayout
      title={seoTitle}
      description={seoDescription}
      image={post?.coverImage || blog?.coverImage || ""}
    >
      {/* Barra de progresso de leitura */}
      <div
        className="pl-blog-reading-progress"
        role="progressbar"
        aria-label="Progresso de leitura"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={readingProgress}
      >
        <div
          className="pl-blog-reading-progress-fill"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="p-container pl-blogs-page pl-blog-article-page">
        <div className="p-page-head pl-blog-article-head">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/blogs">Blog</Link>
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
          <>
            <article className="p-panel pl-blog-article-card">
              <div className="pl-blog-article-cover">
                <Image
                  unoptimized
                  src={coverUrl}
                  alt={post.title}
                  width={1200}
                  height={480}
                  className="pl-blog-article-cover-img"
                />
              </div>

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
                        {formatPrayerDate(post.publishedAt, {
                          year: "numeric",
                        })}
                      </time>
                    </>
                  ) : null}
                  <span>·</span>
                  <span>{readingMinutes} min de leitura</span>
                </div>

                <h1>{post.title}</h1>
                {post.subtitle ? (
                  <p className="pl-blog-article-subtitle">{post.subtitle}</p>
                ) : null}

                <div className="pl-blog-article-author-row">
                  <Image
                    unoptimized
                    src={authorAvatarUrl}
                    alt={`Foto de ${blog.authorName || "Autor"}`}
                    width={42}
                    height={42}
                    className="pl-blog-author-avatar-sm"
                  />
                  <p className="pl-blog-article-byline">
                    Por <strong>{blog.authorName}</strong>
                  </p>
                </div>

                {Array.isArray(post.tags) && post.tags.length > 0 ? (
                  <div className="pl-blog-post-tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="pl-blog-tag-chip">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </header>

              {/* Sumário automático baseado nos títulos H2 e H3 */}
              {showToc ? (
                <nav className="pl-blog-toc" aria-label="Sumário do artigo">
                  <p className="p-eyebrow">NESTE ARTIGO</p>
                  <ol className="pl-blog-toc-list">
                    {headings.map((heading) => (
                      <li
                        key={heading.id}
                        className={`pl-blog-toc-item is-level-${heading.level}`}
                      >
                        <a href={`#${heading.id}`}>{heading.text}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}

              <BlogContentRenderer content={post.content} />

              <footer className="pl-blog-article-footer">
                <div className="pl-blog-author-inline">
                  <div className="pl-blog-author-inline-row">
                    <Image
                      unoptimized
                      src={authorAvatarUrl}
                      alt={`Foto de ${blog.authorName || "Autor"}`}
                      width={56}
                      height={56}
                      className="pl-blog-author-avatar"
                    />
                    <div>
                      <span className="p-eyebrow">SOBRE O AUTOR</span>
                      <p>
                        <strong>{blog.authorName}</strong> — {blog.authorBio}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pl-blog-article-moderation">
                  <div className="p-actions">
                    <button
                      type="button"
                      className="p-button p-button-outline"
                      onClick={handleShareArticle}
                    >
                      Compartilhar artigo
                    </button>
                    {blog.isOwner ? (
                      <Link
                        href="/meu-blog"
                        className="p-button p-button-outline"
                      >
                        Gerenciar no Blog
                      </Link>
                    ) : null}
                  </div>
                  {shareFeedback ? (
                    <p role="status" className="p-muted">
                      {shareFeedback}
                    </p>
                  ) : null}
                  <ReportButton targetType="blog_post" targetId={post._id} />
                </div>
              </footer>
            </article>

            {/* Artigos relacionados ao final */}
            {relatedPosts.length > 0 ? (
              <section
                className="p-panel pl-blog-related-section"
                aria-label="Artigos relacionados"
              >
                <span className="p-eyebrow">CONTINUAR LEITURA</span>
                <h2>Artigos relacionados</h2>
                <div className="pl-blog-related-grid">
                  {relatedPosts.map((related) => (
                    <article
                      key={related._id || related.slug}
                      className="pl-blog-related-card"
                    >
                      <span className="pl-post-category-pill">
                        {related.category}
                      </span>
                      <h3>
                        <Link href={`/blogs/${blog.slug}/${related.slug}`}>
                          {related.title}
                        </Link>
                      </h3>
                      {related.excerpt ? (
                        <p className="p-muted">{related.excerpt}</p>
                      ) : null}
                      <span className="p-muted">
                        {related.readingTimeMinutes || 1} min de leitura
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
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
