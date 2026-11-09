import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import { requestJson, formatPrayerDate } from "@/lib/client";
import { BLOG_INSTITUTIONAL_DISCLAIMER, canPublishInBlog } from "@/lib/blogs";

export default function BlogsDirectory({
  initialItems = [],
  initialMyBlog = null,
  initialCanPublish = false,
  initialPage = 1,
  initialTotalPages = 1,
  initialLoaded = false,
}) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState(initialItems);
  const [myBlog, setMyBlog] = useState(initialMyBlog);
  const [serverCanPublish, setServerCanPublish] = useState(
    Boolean(initialCanPublish),
  );
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(!initialLoaded);
  const [error, setError] = useState("");

  const canEditBlog = canPublishInBlog(session) || serverCanPublish;

  const loadDirectory = useCallback((targetPage = 1) => {
    return requestJson(`/api/blogs?page=${targetPage}`)
      .then((result) => {
        setError("");
        setItems(Array.isArray(result.items) ? result.items : []);
        setMyBlog(result.myBlog || null);
        setServerCanPublish(Boolean(result.canPublish));
        setPage(result.page || targetPage);
        setTotalPages(result.totalPages || 1);
      })
      .catch((err) => {
        setError(
          err?.message || "Não foi possível carregar o Blog no momento.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (status === "loading" || initialLoaded) return;
    loadDirectory(page);
  }, [status, page, initialLoaded, loadDirectory]);

  return (
    <PrayerLayout
      title="Vozes da Comunidade — Blog | Caminhar para Cristo"
      description="Histórias, reflexões e testemunhos compartilhados na caminhada com Cristo."
    >
      <div className="p-container pl-blogs-page">
        <header className="p-page-head pl-blogs-hero">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            Blog
          </div>
          <p className="p-eyebrow">
            <span aria-hidden="true" />
            BLOG · CAMINHAR PARA CRISTO
          </p>
          <h1>Vozes da Comunidade</h1>
          <p className="pl-blogs-lead">
            Histórias, reflexões e testemunhos compartilhados na caminhada com
            Cristo.
          </p>

          {canEditBlog ? (
            <div className="p-actions pl-blogs-hero-actions">
              {myBlog ? (
                <>
                  <Link href="/meu-blog" className="p-button">
                    <Icon name="book" size={18} />
                    Gerenciar meu blog
                  </Link>
                  <Link
                    href={`/blogs/${myBlog.slug}`}
                    className="p-button p-button-outline"
                  >
                    Ver meu blog público
                    <Icon name="arrow" size={16} />
                  </Link>
                </>
              ) : (
                <Link href="/meu-blog" className="p-button">
                  <Icon name="book" size={18} />
                  Criar meu blog
                  <Icon name="arrow" size={16} />
                </Link>
              )}
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="p-notice pl-blogs-notice" role="status">
            <p>{error}</p>
            <button
              type="button"
              className="p-inline-button"
              onClick={() => loadDirectory(page)}
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <section
          className="pl-blogs-directory"
          aria-label="Diretório público do Blog"
        >
          {items.length > 0 ? (
            <>
              <div className="pl-blogs-grid">
                {items.map((blog) => (
                  <article
                    key={blog._id || blog.slug}
                    className="p-panel pl-blog-card"
                  >
                    <div className="pl-blog-card-top">
                      <span className="p-eyebrow">
                        POR {blog.authorName || "Membro da comunidade"}
                      </span>
                      <h2>
                        <Link href={`/blogs/${blog.slug}`}>{blog.name}</Link>
                      </h2>
                      <p className="pl-blog-card-description">
                        {blog.description}
                      </p>
                    </div>

                    <div className="pl-blog-card-footer">
                      <div className="pl-blog-card-meta">
                        <span>
                          {blog.publishedCount === 1
                            ? "1 publicação"
                            : `${blog.publishedCount || 0} publicações`}
                        </span>
                        <span>·</span>
                        <span>
                          {blog.lastPublishedAt
                            ? `Última em ${formatPrayerDate(blog.lastPublishedAt, { year: "numeric" })}`
                            : "Sem publicações ainda"}
                        </span>
                      </div>

                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="p-text-link"
                      >
                        Ler blog
                        <Icon name="arrow" size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 ? (
                <nav
                  className="pl-blogs-pagination"
                  aria-label="Paginação do Blog"
                >
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    disabled={page <= 1 || loading}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Página anterior
                  </button>
                  <span className="pl-blogs-page-indicator">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    disabled={page >= totalPages || loading}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  >
                    Próxima página
                  </button>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="p-panel p-empty pl-blogs-empty">
              <Icon name="book" size={28} />
              <h2>Vozes que edificam a fé</h2>
              <p>
                Este espaço está começando a florescer. Em breve, novas
                reflexões e estudos estarão disponíveis para leitura.
              </p>
              {canEditBlog ? (
                <Link href="/meu-blog" className="p-button">
                  Criar meu blog
                  <Icon name="arrow" size={16} />
                </Link>
              ) : null}
            </div>
          )}
        </section>

        <footer className="pl-blogs-disclaimer" role="note">
          <Icon name="cross" size={15} />
          <p>{BLOG_INSTITUTIONAL_DISCLAIMER}</p>
        </footer>
      </div>
    </PrayerLayout>
  );
}
