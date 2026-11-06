import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BlogContentRenderer from "@/components/prayer/BlogContentRenderer";
import { requestJson, jsonRequest, formatPrayerDate } from "@/lib/client";

const REPORT_REASON_LABELS = {
  privacy: "Privacidade",
  disrespect: "Conteúdo desrespeitoso",
  spam: "Uso indevido / Spam",
  other: "Outro relato",
};

const REPORT_STATUS_LABELS = {
  pending: "Pendente",
  resolved: "Resolvida",
  dismissed: "Improcedente",
};

const POST_STATUS_LABELS = {
  published: "Publicada",
  draft: "Rascunho privado",
  hidden: "Despublicada pela moderação",
};

const BLOG_STATUS_LABELS = {
  active: "Ativo",
  hidden: "Desativado",
};

const ACTION_LABELS = {
  "disable-blog": "Blog desativado",
  "enable-blog": "Blog reativado",
  "hide-blog-post": "Publicação despublicada",
  "restore-blog-post": "Publicação restaurada",
  "resolve-blog-report": "Denúncia marcada como resolvida",
  "dismiss-blog-report": "Denúncia marcada como improcedente",
  "inspect-blog": "Consulta administrativa ao blog",
  "review-blog-post": "Revisão administrativa de publicação",
  "hide-requested": "Conteúdo recolhido pela moderação",
  "restore-requested": "Visibilidade restaurada pela moderação",
  "review-content": "Revisão de conteúdo auditada",
};

export default function BlogManager() {
  const [view, setView] = useState("blogs");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [blogFilterId, setBlogFilterId] = useState("");
  const [blogFilterName, setBlogFilterName] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const generation = useRef(0);

  const loadList = useCallback(
    (
      overrideView = view,
      overrideQ = q,
      overrideStatus = statusFilter,
      overridePage = page,
      overrideBlogId = blogFilterId,
    ) => {
      const gen = ++generation.current;
      const params = new URLSearchParams({
        view: overrideView,
        page: String(overridePage),
      });
      if (overrideQ.trim()) params.set("q", overrideQ.trim());
      if (overrideStatus) params.set("status", overrideStatus);
      if (overrideBlogId) params.set("blogId", overrideBlogId);

      return requestJson(`/api/admin/blogs?${params.toString()}`)
        .then((result) => {
          if (gen !== generation.current) return;
          setError("");
          setData(result);
        })
        .catch((err) => {
          if (gen !== generation.current) return;
          setError(
            err.message || "Não foi possível carregar os registros de blogs.",
          );
        })
        .finally(() => {
          if (gen === generation.current) {
            setLoading(false);
          }
        });
    },
    [view, q, statusFilter, page, blogFilterId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadList();
    }, 150);
    return () => {
      clearTimeout(timer);
      generation.current += 1;
    };
  }, [loadList]);

  function requireReason() {
    if (!reason.trim()) {
      setError(
        "Informe o motivo da moderação antes de executar uma ação administrativa.",
      );
      return false;
    }
    return true;
  }

  async function inspectItem(targetType, targetId) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const params = new URLSearchParams({
        view: "detail",
        targetType,
        targetId,
        reason: reason.trim() || "Consulta administrativa no painel de Blogs",
      });
      const result = await requestJson(`/api/admin/blogs?${params.toString()}`);
      setDetail(result);
    } catch (err) {
      setError(err.message || "Não foi possível consultar os detalhes.");
    } finally {
      setBusy(false);
    }
  }

  async function executeModeration(targetType, targetId, action) {
    if (!requireReason()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestJson(
        "/api/admin/blogs",
        jsonRequest("PATCH", {
          targetType,
          targetId,
          action,
          reason: reason.trim(),
        }),
      );
      setNotice(result.message || "Ação administrativa registrada.");
      await loadList();
      if (detail) {
        const refreshedTargetType = detail.targetType;
        const refreshedTargetId =
          detail.targetType === "blog" ? detail.blog._id : detail.post._id;
        const params = new URLSearchParams({
          view: "detail",
          targetType: refreshedTargetType,
          targetId: refreshedTargetId,
          reason: reason.trim(),
        });
        const updatedDetail = await requestJson(
          `/api/admin/blogs?${params.toString()}`,
        );
        setDetail(updatedDetail);
      }
    } catch (err) {
      setError(
        err.message || "Não foi possível concluir a ação administrativa.",
      );
    } finally {
      setBusy(false);
    }
  }

  function switchSubView(
    nextView,
    nextStatus = "",
    nextBlogId = "",
    nextBlogName = "",
  ) {
    setLoading(true);
    setError("");
    setNotice("");
    setView(nextView);
    setStatusFilter(nextStatus);
    setBlogFilterId(nextBlogId);
    setBlogFilterName(nextBlogName);
    setPage(1);
  }

  const stats = data?.stats;

  return (
    <section aria-label="Gerenciar blogs da comunidade" aria-busy={loading}>
      <div className="p-admin-stat-grid">
        {[
          ["Blogs cadastrados", stats?.totalBlogs],
          ["Blogs ativos", stats?.activeBlogs],
          ["Blogs desativados", stats?.hiddenBlogs],
          ["Publicações nos blogs", stats?.totalPosts],
          ["Publicações ativas", stats?.publishedPosts],
          ["Denúncias pendentes", stats?.pendingReports],
        ].map(([label, value]) => (
          <div className="p-panel" key={label}>
            <strong>{value ?? "—"}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div
        className="p-tabs"
        role="group"
        aria-label="Subáreas de administração de Blogs"
        style={{ marginTop: "1rem", marginBottom: "1rem" }}
      >
        <button
          type="button"
          aria-pressed={view === "blogs"}
          onClick={() => switchSubView("blogs", "")}
        >
          Blogs cadastrados
        </button>
        <button
          type="button"
          aria-pressed={view === "posts"}
          onClick={() => switchSubView("posts", "")}
        >
          Publicações dos blogs
        </button>
        <button
          type="button"
          aria-pressed={view === "reports"}
          onClick={() => switchSubView("reports", "pending")}
        >
          Denúncias de blogs
        </button>
      </div>

      <label className="p-field p-admin-reason">
        Motivo da ação administrativa ou da revisão
        <textarea
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Descreva o motivo para desativar/reativar blog, despublicar/restaurar publicação ou julgar denúncia…"
        />
        <small>
          Obrigatório para ações de moderação. Toda decisão é gravada na
          auditoria sem alterar o texto autoral.
        </small>
      </label>

      {notice ? (
        <p className="p-notice" role="status">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p className="p-error" role="alert">
          {error}
        </p>
      ) : null}

      {detail ? (
        <section
          className="p-panel p-review-panel"
          aria-label="Detalhes e histórico de moderação"
          style={{ marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="p-eyebrow">CONSULTA REGISTRADA NA AUDITORIA</p>
              <h2>
                {detail.targetType === "blog"
                  ? `Blog: ${detail.blog.name}`
                  : `Publicação: ${detail.post.title}`}
              </h2>
            </div>
            <button
              type="button"
              className="p-button p-button-outline"
              onClick={() => setDetail(null)}
            >
              Fechar detalhes
            </button>
          </div>

          {detail.targetType === "blog" ? (
            <div>
              <p className="p-muted">
                Proprietário: <strong>{detail.blog.ownerName}</strong>{" "}
                {detail.blog.ownerEmail ? `(${detail.blog.ownerEmail})` : ""} ·
                Slug: <code>/blogs/{detail.blog.slug}</code> · Situação:{" "}
                <strong>
                  {BLOG_STATUS_LABELS[detail.blog.status] || detail.blog.status}
                </strong>
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                <strong>Descrição:</strong> {detail.blog.description}
              </p>
              <p style={{ marginTop: "0.35rem" }}>
                <strong>Apresentação do autor:</strong> {detail.blog.authorBio}
              </p>

              <div className="p-actions" style={{ marginTop: "1rem" }}>
                {detail.blog.status === "active" ? (
                  <button
                    type="button"
                    className="p-button"
                    disabled={busy}
                    onClick={() =>
                      executeModeration("blog", detail.blog._id, "disable")
                    }
                  >
                    Desativar blog
                  </button>
                ) : (
                  <button
                    type="button"
                    className="p-button"
                    disabled={busy}
                    onClick={() =>
                      executeModeration("blog", detail.blog._id, "enable")
                    }
                  >
                    Reativar blog
                  </button>
                )}
                {detail.blog.status === "active" ? (
                  <Link
                    href={`/blogs/${detail.blog.slug}`}
                    className="p-button p-button-outline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir página pública
                  </Link>
                ) : null}
              </div>

              <h3 style={{ marginTop: "1.5rem" }}>
                Publicações vinculadas ({detail.posts.length})
              </h3>
              {detail.posts.length === 0 ? (
                <p className="p-muted">
                  Este blog ainda não possui publicações cadastradas.
                </p>
              ) : (
                <div
                  className="p-admin-records"
                  style={{ marginTop: "0.75rem" }}
                >
                  {detail.posts.map((post) => (
                    <article key={post._id} className="p-panel">
                      <div>
                        <p className="p-eyebrow">
                          {post.category} ·{" "}
                          {POST_STATUS_LABELS[post.status] || post.status}
                          {post.pendingReportsCount > 0
                            ? ` · ${post.pendingReportsCount} denúncia(s) pendente(s)`
                            : ""}
                        </p>
                        <h4>{post.title}</h4>
                        <p className="p-muted">
                          Slug: <code>{post.slug}</code> · Atualizado em{" "}
                          {formatPrayerDate(post.updatedAt, {
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="p-admin-record-actions">
                        <button
                          type="button"
                          className="p-button p-button-outline"
                          disabled={busy}
                          onClick={() => inspectItem("blog_post", post._id)}
                        >
                          Visualizar publicação
                        </button>
                        {post.status === "published" ? (
                          <button
                            type="button"
                            className="p-button p-button-outline"
                            disabled={busy}
                            onClick={() =>
                              executeModeration("blog_post", post._id, "hide")
                            }
                          >
                            Despublicar
                          </button>
                        ) : post.status === "hidden" ? (
                          <button
                            type="button"
                            className="p-button p-button-outline"
                            disabled={busy}
                            onClick={() =>
                              executeModeration(
                                "blog_post",
                                post._id,
                                "restore",
                              )
                            }
                          >
                            Restaurar publicação
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="p-muted">
                Blog: <strong>{detail.post.blogName}</strong> (
                <code>/blogs/{detail.post.blogSlug}</code>) · Autor:{" "}
                <strong>{detail.post.authorName}</strong> · Categoria:{" "}
                <strong>{detail.post.category}</strong> · Status:{" "}
                <strong>
                  {POST_STATUS_LABELS[detail.post.status] || detail.post.status}
                </strong>
              </p>
              {detail.post.subtitle ? (
                <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
                  {detail.post.subtitle}
                </p>
              ) : null}

              <div
                className="p-panel"
                style={{ marginTop: "1rem", marginBottom: "1rem" }}
              >
                {detail.post.status === "draft" ? (
                  <p className="p-muted">
                    Este texto encontra-se em rascunho privado do autor e não
                    está publicado.
                  </p>
                ) : (
                  <BlogContentRenderer content={detail.post.content || ""} />
                )}
              </div>

              <div className="p-actions">
                {detail.post.status === "published" ? (
                  <button
                    type="button"
                    className="p-button"
                    disabled={busy}
                    onClick={() =>
                      executeModeration("blog_post", detail.post._id, "hide")
                    }
                  >
                    Despublicar conteúdo
                  </button>
                ) : null}
                {detail.post.status === "hidden" ? (
                  <button
                    type="button"
                    className="p-button"
                    disabled={busy}
                    onClick={() =>
                      executeModeration("blog_post", detail.post._id, "restore")
                    }
                  >
                    Restaurar publicação
                  </button>
                ) : null}
                <button
                  type="button"
                  className="p-button p-button-outline"
                  disabled={busy}
                  onClick={() => inspectItem("blog", detail.post.blogId)}
                >
                  Consultar blog de origem
                </button>
              </div>
            </div>
          )}

          <h3 style={{ marginTop: "1.5rem" }}>
            Denúncias vinculadas ({detail.reports?.length || 0})
          </h3>
          {!detail.reports?.length ? (
            <p className="p-muted">Nenhuma denúncia registrada.</p>
          ) : (
            <div className="p-admin-records" style={{ marginTop: "0.75rem" }}>
              {detail.reports.map((report) => (
                <article key={report._id} className="p-panel">
                  <div>
                    <p className="p-eyebrow">
                      {REPORT_REASON_LABELS[report.reason] || report.reason} ·{" "}
                      {REPORT_STATUS_LABELS[report.status] || report.status}
                    </p>
                    <p>{report.details || "Sem observações adicionais."}</p>
                    <p className="p-muted">
                      Registrada em{" "}
                      {formatPrayerDate(report.createdAt, {
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {report.status === "pending" ? (
                    <div className="p-admin-record-actions">
                      <button
                        type="button"
                        className="p-button p-button-outline"
                        disabled={busy}
                        onClick={() =>
                          executeModeration("report", report._id, "resolve")
                        }
                      >
                        Marcar como resolvida
                      </button>
                      <button
                        type="button"
                        className="p-button p-button-outline"
                        disabled={busy}
                        onClick={() =>
                          executeModeration("report", report._id, "dismiss")
                        }
                      >
                        Marcar como improcedente
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: "1.5rem" }}>
            Histórico de moderação ({detail.history?.length || 0})
          </h3>
          {!detail.history?.length ? (
            <p className="p-muted">
              Nenhuma ação administrativa anterior registrada.
            </p>
          ) : (
            <div className="p-admin-records" style={{ marginTop: "0.75rem" }}>
              {detail.history.map((entry) => (
                <article key={entry._id} className="p-panel">
                  <div>
                    <p className="p-eyebrow">
                      {ACTION_LABELS[entry.action] || entry.action} ·{" "}
                      {entry.targetType}
                    </p>
                    <p>
                      <strong>Motivo:</strong> {entry.reason}
                    </p>
                    <p className="p-muted">
                      Administrador: {entry.actorName} ·{" "}
                      {formatPrayerDate(entry.createdAt, {
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {view !== "reports" ? (
        <div className="p-community-filters p-panel">
          <label className="p-field">
            {view === "blogs"
              ? "Pesquisar por nome do blog ou proprietário"
              : "Pesquisar por título, categoria, blog ou autor"}
            <input
              type="search"
              maxLength={80}
              value={q}
              onChange={(event) => {
                setLoading(true);
                setQ(event.target.value);
                setPage(1);
              }}
              placeholder={
                view === "blogs"
                  ? "Nome do blog, slug ou proprietário…"
                  : "Título, categoria, blog ou autor…"
              }
            />
          </label>
          <label className="p-field">
            {view === "blogs" ? "Situação do blog" : "Situação da publicação"}
            <select
              value={statusFilter}
              onChange={(event) => {
                setLoading(true);
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              {view === "blogs" ? (
                <>
                  <option value="">Todos os blogs</option>
                  <option value="active">Ativos</option>
                  <option value="hidden">Desativados</option>
                  <option value="reported">Com denúncias pendentes</option>
                </>
              ) : (
                <>
                  <option value="">Todas as publicações</option>
                  <option value="published">Publicadas</option>
                  <option value="draft">Rascunhos privados</option>
                  <option value="hidden">Despublicadas pela moderação</option>
                  <option value="reported">Com denúncias pendentes</option>
                </>
              )}
            </select>
          </label>
          {view === "posts" && blogFilterId ? (
            <div className="p-field" style={{ justifyContent: "flex-end" }}>
              <span>Filtrando pelo blog: {blogFilterName}</span>
              <button
                type="button"
                className="p-button p-button-outline"
                onClick={() => {
                  setLoading(true);
                  setBlogFilterId("");
                  setBlogFilterName("");
                  setPage(1);
                }}
              >
                Limpar filtro de blog
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-community-filters p-panel">
          <label className="p-field">
            Situação da denúncia
            <select
              value={statusFilter}
              onChange={(event) => {
                setLoading(true);
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="pending">Pendentes</option>
              <option value="resolved">Resolvidas</option>
              <option value="dismissed">Improcedentes</option>
              <option value="">Todas as denúncias</option>
            </select>
          </label>
        </div>
      )}

      {loading ? (
        <p className="p-loading" role="status">
          Carregando registros de blogs…
        </p>
      ) : view === "blogs" ? (
        <>
          <p className="p-muted" style={{ margin: "0.75rem 0" }}>
            {data?.filtered ?? 0} blog(s) encontrado(s)
          </p>
          {!data?.items?.length ? (
            <div className="p-empty">
              <h2>Nenhum blog encontrado para este filtro.</h2>
              <p>Ajuste a busca ou o filtro de situação.</p>
            </div>
          ) : (
            <div className="p-admin-records">
              {data.items.map((blog) => (
                <article key={blog._id} className="p-panel">
                  <div>
                    <p className="p-eyebrow">
                      {BLOG_STATUS_LABELS[blog.status] || blog.status} ·{" "}
                      <code>/blogs/{blog.slug}</code>
                      {blog.pendingReportsCount > 0
                        ? ` · ${blog.pendingReportsCount} denúncia(s) pendente(s)`
                        : ""}
                    </p>
                    <h2>{blog.name}</h2>
                    <p>{blog.description}</p>
                    <p className="p-muted">
                      Proprietário: <strong>{blog.ownerName}</strong> ·{" "}
                      {blog.postsCount} publicação(ões) ({blog.publishedCount}{" "}
                      publicada(s), {blog.draftCount} rascunho(s),{" "}
                      {blog.hiddenCount} despublicada(s))
                    </p>
                    <p className="p-muted">
                      Criado em{" "}
                      {formatPrayerDate(blog.createdAt, { year: "numeric" })} ·
                      Última atividade em{" "}
                      {formatPrayerDate(blog.lastActivityAt, {
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="p-admin-record-actions">
                    <button
                      type="button"
                      className="p-button p-button-outline"
                      disabled={busy}
                      onClick={() => inspectItem("blog", blog._id)}
                    >
                      Consultar detalhes e histórico
                    </button>
                    <button
                      type="button"
                      className="p-button p-button-outline"
                      disabled={busy}
                      onClick={() =>
                        switchSubView("posts", "", blog._id, blog.name)
                      }
                    >
                      Ver publicações ({blog.postsCount})
                    </button>
                    {blog.status === "active" ? (
                      <button
                        type="button"
                        className="p-button p-button-outline"
                        disabled={busy}
                        onClick={() =>
                          executeModeration("blog", blog._id, "disable")
                        }
                      >
                        Desativar blog
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="p-button"
                        disabled={busy}
                        onClick={() =>
                          executeModeration("blog", blog._id, "enable")
                        }
                      >
                        Reativar blog
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : view === "posts" ? (
        <>
          <p className="p-muted" style={{ margin: "0.75rem 0" }}>
            {data?.filtered ?? 0} publicação(ões) encontrada(s)
          </p>
          {!data?.items?.length ? (
            <div className="p-empty">
              <h2>Nenhuma publicação encontrada para este filtro.</h2>
              <p>Ajuste a busca ou o filtro de situação.</p>
            </div>
          ) : (
            <div className="p-admin-records">
              {data.items.map((post) => (
                <article key={post._id} className="p-panel">
                  <div>
                    <p className="p-eyebrow">
                      {post.category} ·{" "}
                      {POST_STATUS_LABELS[post.status] || post.status}
                      {post.pendingReportsCount > 0
                        ? ` · ${post.pendingReportsCount} denúncia(s) pendente(s)`
                        : post.totalReportsCount > 0
                          ? ` · ${post.totalReportsCount} denúncia(s) no histórico`
                          : ""}
                    </p>
                    <h2>{post.title}</h2>
                    {post.subtitle ? <p>{post.subtitle}</p> : null}
                    <p className="p-muted">
                      Blog de origem: <strong>{post.blogName}</strong> (
                      <code>/blogs/{post.blogSlug}</code>) · Autor:{" "}
                      <strong>{post.authorName}</strong>
                    </p>
                    <p className="p-muted">
                      {post.publishedAt
                        ? `Publicado em ${formatPrayerDate(post.publishedAt, {
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : `Criado em ${formatPrayerDate(post.createdAt, {
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                    </p>
                  </div>
                  <div className="p-admin-record-actions">
                    <button
                      type="button"
                      className="p-button p-button-outline"
                      disabled={busy}
                      onClick={() => inspectItem("blog_post", post._id)}
                    >
                      Visualizar publicação
                    </button>
                    {post.status === "published" ? (
                      <button
                        type="button"
                        className="p-button p-button-outline"
                        disabled={busy}
                        onClick={() =>
                          executeModeration("blog_post", post._id, "hide")
                        }
                      >
                        Despublicar conteúdo
                      </button>
                    ) : post.status === "hidden" ? (
                      <button
                        type="button"
                        className="p-button"
                        disabled={busy}
                        onClick={() =>
                          executeModeration("blog_post", post._id, "restore")
                        }
                      >
                        Restaurar publicação
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="p-muted" style={{ margin: "0.75rem 0" }}>
            {data?.filtered ?? 0} denúncia(s) encontrada(s)
          </p>
          {!data?.items?.length ? (
            <div className="p-empty">
              <h2>Nenhuma denúncia encontrada nesta fila.</h2>
              <p>As denúncias de publicações de blogs aparecerão aqui.</p>
            </div>
          ) : (
            <div className="p-admin-records">
              {data.items.map((report) => (
                <article key={report._id} className="p-panel">
                  <div>
                    <p className="p-eyebrow">
                      {REPORT_REASON_LABELS[report.reason] || report.reason} ·{" "}
                      {REPORT_STATUS_LABELS[report.status] || report.status}
                    </p>
                    <h2>{report.postTitle}</h2>
                    <p>{report.details || "Sem observações adicionais."}</p>
                    <p className="p-muted">
                      Blog: <strong>{report.blogName}</strong> · Autor:{" "}
                      <strong>{report.authorName}</strong> · Status da
                      publicação:{" "}
                      <strong>
                        {POST_STATUS_LABELS[report.postStatus] ||
                          report.postStatus}
                      </strong>
                    </p>
                    <p className="p-muted">
                      Denúncia registrada em{" "}
                      {formatPrayerDate(report.createdAt, {
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="p-admin-record-actions">
                    <button
                      type="button"
                      className="p-button p-button-outline"
                      disabled={busy}
                      onClick={() => inspectItem("blog_post", report.targetId)}
                    >
                      Visualizar publicação
                    </button>
                    {report.postStatus === "published" ? (
                      <button
                        type="button"
                        className="p-button p-button-outline"
                        disabled={busy}
                        onClick={() =>
                          executeModeration(
                            "blog_post",
                            report.targetId,
                            "hide",
                          )
                        }
                      >
                        Despublicar conteúdo
                      </button>
                    ) : null}
                    {report.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          className="p-button p-button-outline"
                          disabled={busy}
                          onClick={() =>
                            executeModeration("report", report._id, "resolve")
                          }
                        >
                          Marcar como resolvida
                        </button>
                        <button
                          type="button"
                          className="p-inline-button"
                          disabled={busy}
                          onClick={() =>
                            executeModeration("report", report._id, "dismiss")
                          }
                        >
                          Marcar como improcedente
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {data && data.pages > 1 ? (
        <nav
          className="p-community-actions"
          aria-label="Paginação de administração de blogs"
          style={{ marginTop: "1rem" }}
        >
          <button
            type="button"
            className="p-button p-button-outline"
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage(page - 1);
            }}
          >
            Anterior
          </button>
          <span>
            Página {page} de {data.pages}
          </span>
          <button
            type="button"
            className="p-button p-button-outline"
            disabled={page >= data.pages || loading}
            onClick={() => {
              setLoading(true);
              setPage(page + 1);
            }}
          >
            Próxima
          </button>
        </nav>
      ) : null}
    </section>
  );
}
