import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import { requestJson, formatPrayerDate } from "@/lib/client";
import { BLOG_INSTITUTIONAL_DISCLAIMER } from "@/lib/blogs";

export default function PublicBlogPage({
  initialBlog = null,
  initialPosts = [],
  initialPage = 1,
  initialTotalPages = 1,
  initialLoaded = false,
}) {
  const router = useRouter();
  const slug =
    typeof router.query?.slug === "string"
      ? router.query.slug
      : initialBlog?.slug || "";

  const [blog, setBlog] = useState(initialBlog);
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(!initialLoaded);
  const [error, setError] = useState("");

  const loadBlog = useCallback(
    (targetPage = 1) => {
      if (!slug) return Promise.resolve();
      return requestJson(
        `/api/blogs/${encodeURIComponent(slug)}?page=${targetPage}`,
      )
        .then((result) => {
          setError("");
          setBlog(result.blog);
          setPosts(Array.isArray(result.posts) ? result.posts : []);
          setPage(result.page || targetPage);
          setTotalPages(result.totalPages || 1);
        })
        .catch((err) => {
          setError(err?.message || "Este blog não está disponível.");
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [slug],
  );

  useEffect(() => {
    if (initialLoaded || !slug) return;
    loadBlog(page);
  }, [slug, page, initialLoaded, loadBlog]);

  const seoTitle = blog
    ? `${blog.name} — Vozes da Comunidade | Caminhar para Cristo`
    : "Blog da Comunidade | Caminhar para Cristo";
  const seoDescription =
    blog?.description ||
    "Reflexões, estudos e testemunhos na caminhada com Cristo.";

  return (
    <PrayerLayout title={seoTitle} description={seoDescription}>
      <div className="p-container pl-blogs-page pl-public-blog-page">
        <header className="p-page-head pl-blogs-hero">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/blogs">Blogs</Link>
            <span>/</span>
            {blog?.name || "Blog"}
          </div>

          {blog ? (
            <>
              <p className="p-eyebrow">
                <span aria-hidden="true" />
                POR {blog.authorName || "Membro da comunidade"}
              </p>
              <h1>{blog.name}</h1>
              <p className="pl-blogs-lead">{blog.description}</p>
              {blog.isOwner ? (
                <div className="p-actions">
                  <Link href="/meu-blog" className="p-button p-button-outline">
                    Administrar meu blog
                  </Link>
                </div>
              ) : null}
            </>
          ) : null}
        </header>

        {loading && !blog ? (
          <p className="p-loading" role="status">
            Carregando blog…
          </p>
        ) : error || !blog ? (
          <div className="p-panel p-empty">
            <h2>Blog não encontrado</h2>
            <p>
              {error || "O endereço informado não corresponde a um blog ativo."}
            </p>
            <Link href="/blogs" className="p-button p-button-outline">
              <Icon name="back" size={16} />
              Voltar para Vozes da Comunidade
            </Link>
          </div>
        ) : (
          <>
            <aside
              className="p-panel pl-blog-author-card"
              aria-label="Apresentação do autor"
            >
              <span className="p-eyebrow">SOBRE O AUTOR</span>
              <h2>{blog.authorName}</h2>
              <p>{blog.authorBio}</p>
            </aside>

            <section
              className="pl-blog-posts-section"
              aria-labelledby="public-posts-heading"
            >
              <div className="pl-blog-section-head">
                <span className="p-eyebrow">PUBLICAÇÕES</span>
                <h2 id="public-posts-heading">Textos publicados</h2>
              </div>

              {posts.length === 0 ? (
                <div className="p-panel p-empty">
                  <p>
                    Este blog ainda não possui publicações abertas ao público.
                  </p>
                </div>
              ) : (
                <div className="pl-blog-post-list">
                  {posts.map((post) => (
                    <article
                      key={post._id || post.slug}
                      className="p-panel pl-blog-post-card"
                    >
                      <div className="pl-blog-post-meta">
                        <span className="pl-post-category-pill">
                          {post.category}
                        </span>
                        <span>·</span>
                        <time dateTime={String(post.publishedAt || "")}>
                          {post.publishedAt
                            ? formatPrayerDate(post.publishedAt, {
                                year: "numeric",
                              })
                            : ""}
                        </time>
                      </div>

                      <h3>
                        <Link href={`/blogs/${blog.slug}/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>

                      {post.subtitle ? (
                        <p className="pl-blog-post-subtitle">{post.subtitle}</p>
                      ) : null}

                      {post.excerpt ? (
                        <p className="pl-blog-post-excerpt">{post.excerpt}</p>
                      ) : null}

                      <Link
                        href={`/blogs/${blog.slug}/${post.slug}`}
                        className="p-text-link"
                      >
                        Ler publicação
                        <Icon name="arrow" size={16} />
                      </Link>
                    </article>
                  ))}
                </div>
              )}

              {totalPages > 1 ? (
                <nav
                  className="pl-blogs-pagination"
                  aria-label="Paginação de publicações"
                >
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    disabled={page <= 1}
                    onClick={() => {
                      const next = Math.max(1, page - 1);
                      setPage(next);
                      loadBlog(next);
                    }}
                  >
                    Anteriores
                  </button>
                  <span className="pl-blogs-page-indicator">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const next = Math.min(totalPages, page + 1);
                      setPage(next);
                      loadBlog(next);
                    }}
                  >
                    Próximas
                  </button>
                </nav>
              ) : null}
            </section>

            <div className="pl-daily-prayer-return">
              <Link href="/blogs" className="p-button p-button-outline">
                <Icon name="back" size={16} />
                Voltar para Vozes da Comunidade
              </Link>
            </div>
          </>
        )}

        <footer className="pl-blogs-disclaimer" role="note">
          <Icon name="cross" size={15} />
          <p>{BLOG_INSTITUTIONAL_DISCLAIMER}</p>
        </footer>
      </div>
    </PrayerLayout>
  );
}
