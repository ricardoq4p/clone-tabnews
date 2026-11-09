import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import BlogContentRenderer from "@/components/prayer/BlogContentRenderer";
import BlogCoverUploader from "@/components/BlogCoverUploader";
import { requestJson, jsonRequest, formatPrayerDate } from "@/lib/client";
import {
  BLOG_CATEGORIES,
  BLOG_INSTITUTIONAL_DISCLAIMER,
  DEFAULT_AUTHOR_AVATAR,
  DEFAULT_BLOG_COVER_IMAGE,
  canPublishInBlog,
  normalizeBlogTags,
  slugifyText,
} from "@/lib/blogs";

export default function MeuBlogPage({
  initialBlog = null,
  initialPosts = [],
  initialLoaded = false,
}) {
  const { data: session, status } = useSession();
  const canPublish = canPublishInBlog(session);
  const [blog, setBlog] = useState(initialBlog);
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(!initialLoaded);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Blog creation / settings state
  const [editingBlogInfo, setEditingBlogInfo] = useState(false);
  const [previewBlogMode, setPreviewBlogMode] = useState(false);
  const [blogName, setBlogName] = useState(initialBlog?.name || "");
  const [blogSlug, setBlogSlug] = useState(initialBlog?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialBlog?.slug));
  const [blogDescription, setBlogDescription] = useState(
    initialBlog?.description || "",
  );
  const [blogAuthorBio, setBlogAuthorBio] = useState(
    initialBlog?.authorBio || "",
  );
  const [blogCoverImage, setBlogCoverImage] = useState(
    initialBlog?.coverImage || "",
  );
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [savingBlog, setSavingBlog] = useState(false);

  // Post editor state
  const [editorOpen, setEditorOpen] = useState(true);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postTitle, setPostTitle] = useState("");
  const [postSubtitle, setPostSubtitle] = useState("");
  const [postCategory, setPostCategory] = useState(BLOG_CATEGORIES[0]);
  const [postCoverImage, setPostCoverImage] = useState("");
  const [postTagsInput, setPostTagsInput] = useState("");
  const [postFeatured, setPostFeatured] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [busyPostId, setBusyPostId] = useState(null);
  const contentRef = useRef(null);

  const loadOwnerWorkspace = useCallback(() => {
    return requestJson("/api/blogs/meu")
      .then((result) => {
        setError("");
        setBlog(result.blog || null);
        setPosts(Array.isArray(result.posts) ? result.posts : []);
        if (result.blog) {
          setBlogName(result.blog.name);
          setBlogSlug(result.blog.slug);
          setSlugTouched(true);
          setBlogDescription(result.blog.description);
          setBlogAuthorBio(result.blog.authorBio);
          setBlogCoverImage(result.blog.coverImage || "");
        }
      })
      .catch((err) => {
        setError(
          err?.message || "Não foi possível carregar o painel do seu blog.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (status === "loading" || initialLoaded || !session || !canPublish)
      return;
    loadOwnerWorkspace();
  }, [status, session, canPublish, initialLoaded, loadOwnerWorkspace]);

  function handleNameChange(value) {
    setBlogName(value);
    setAvailabilityStatus(null);
    if (!slugTouched) {
      setBlogSlug(slugifyText(value, 60));
    }
  }

  function handleSlugChange(value) {
    setSlugTouched(true);
    setBlogSlug(slugifyText(value, 60));
    setAvailabilityStatus(null);
  }

  async function checkAvailability() {
    const candidateSlug = slugifyText(blogSlug || blogName, 60);
    setCheckingAvailability(true);
    setAvailabilityStatus(null);
    try {
      const params = new URLSearchParams({
        name: blogName,
        slug: candidateSlug,
        ...(blog?._id ? { excludeBlogId: blog._id } : {}),
      });
      const result = await requestJson(
        `/api/blogs/disponibilidade?${params.toString()}`,
      );
      if (result.suggestedSlug && !slugTouched) {
        setBlogSlug(result.suggestedSlug);
      }
      setAvailabilityStatus(result);
    } catch (err) {
      setAvailabilityStatus({
        available: false,
        reason: err?.message || "Não foi possível verificar disponibilidade.",
      });
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function handleSaveBlog(event) {
    event.preventDefault();
    setSavingBlog(true);
    setError("");
    setStatusMessage("");
    try {
      const endpoint = blog ? "/api/blogs/meu" : "/api/blogs";
      const method = blog ? "PATCH" : "POST";
      const result = await requestJson(
        endpoint,
        jsonRequest(method, {
          name: blogName,
          slug: blogSlug || slugifyText(blogName, 60),
          description: blogDescription,
          authorBio: blogAuthorBio,
          coverImage: blogCoverImage,
        }),
      );
      setBlog(result.blog);
      setBlogName(result.blog.name);
      setBlogSlug(result.blog.slug);
      setSlugTouched(true);
      setBlogDescription(result.blog.description);
      setBlogAuthorBio(result.blog.authorBio);
      setBlogCoverImage(result.blog.coverImage || "");
      setEditingBlogInfo(false);
      setPreviewBlogMode(false);
      setStatusMessage(
        blog
          ? "Dados do blog atualizados com sucesso."
          : "Seu blog pessoal foi criado com sucesso.",
      );
    } catch (err) {
      setError(err?.message || "Não foi possível salvar os dados do blog.");
    } finally {
      setSavingBlog(false);
    }
  }

  function resetPostEditor() {
    setEditingPostId(null);
    setPostTitle("");
    setPostSubtitle("");
    setPostCategory(BLOG_CATEGORIES[0]);
    setPostCoverImage("");
    setPostTagsInput("");
    setPostFeatured(false);
    setPostContent("");
    setPreviewMode(false);
  }

  function startEditPost(post) {
    setEditingPostId(post._id);
    setPostTitle(post.title);
    setPostSubtitle(post.subtitle || "");
    setPostCategory(post.category || BLOG_CATEGORIES[0]);
    setPostCoverImage(post.coverImage || "");
    setPostTagsInput(Array.isArray(post.tags) ? post.tags.join(", ") : "");
    setPostFeatured(Boolean(post.featured));
    setPostContent(post.content || "");
    setPreviewMode(false);
    setEditorOpen(true);
    setError("");
    setStatusMessage("");
  }

  function insertFormatting(kind) {
    const textarea = contentRef.current;
    if (!textarea) {
      if (kind === "h2")
        setPostContent((old) => `${old}\n\n## Título da seção`);
      if (kind === "h3") setPostContent((old) => `${old}\n\n### Subtítulo`);
      if (kind === "bold")
        setPostContent((old) => `${old} **texto em negrito**`);
      if (kind === "italic")
        setPostContent((old) => `${old} *texto em itálico*`);
      if (kind === "list")
        setPostContent((old) => `${old}\n\n- Primeiro item\n- Segundo item`);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selected = postContent.slice(start, end);

    let replacement = "";
    if (kind === "h2") {
      replacement = `\n## ${selected || "Título da seção"}\n`;
    } else if (kind === "h3") {
      replacement = `\n### ${selected || "Subtítulo da seção"}\n`;
    } else if (kind === "bold") {
      replacement = `**${selected || "texto em negrito"}**`;
    } else if (kind === "italic") {
      replacement = `*${selected || "texto em itálico"}*`;
    } else if (kind === "list") {
      const items = selected
        ? selected
            .split("\n")
            .map((line) => `- ${line.replace(/^[-•*]\s+/, "")}`)
            .join("\n")
        : "- Primeiro ponto\n- Segundo ponto";
      replacement = `\n${items}\n`;
    }

    const nextValue =
      postContent.slice(0, start) + replacement + postContent.slice(end);
    setPostContent(nextValue);
  }

  async function handleSavePost(targetStatus) {
    setSavingPost(true);
    setError("");
    setStatusMessage("");
    try {
      const payload = {
        title: postTitle,
        subtitle: postSubtitle,
        category: postCategory,
        coverImage: postCoverImage,
        tags: normalizeBlogTags(postTagsInput),
        featured: postFeatured,
        content: postContent,
        status: targetStatus,
      };
      if (editingPostId) {
        const result = await requestJson(
          `/api/blogs/publicacoes/${editingPostId}`,
          jsonRequest("PATCH", payload),
        );
        setPosts((current) =>
          current.map((item) => {
            if (item._id === result.post._id) return result.post;
            if (result.post.featured) return { ...item, featured: false };
            return item;
          }),
        );
        setStatusMessage(
          targetStatus === "published"
            ? "Publicação atualizada e publicada."
            : "Rascunho salvo com sucesso.",
        );
      } else {
        const result = await requestJson(
          "/api/blogs/publicacoes",
          jsonRequest("POST", payload),
        );
        setPosts((current) => {
          const rest = result.post.featured
            ? current.map((item) => ({ ...item, featured: false }))
            : current;
          return [result.post, ...rest];
        });
        setStatusMessage(
          targetStatus === "published"
            ? "Artigo publicado com sucesso."
            : "Rascunho salvo com sucesso.",
        );
      }
      resetPostEditor();
    } catch (err) {
      setError(err?.message || "Não foi possível salvar a publicação.");
    } finally {
      setSavingPost(false);
    }
  }

  async function handleTogglePostStatus(post) {
    const nextAction = post.status === "published" ? "unpublish" : "publish";
    setBusyPostId(post._id);
    setError("");
    setStatusMessage("");
    try {
      const result = await requestJson(
        `/api/blogs/publicacoes/${post._id}`,
        jsonRequest("PATCH", { action: nextAction }),
      );
      setPosts((current) =>
        current.map((item) =>
          item._id === result.post._id ? result.post : item,
        ),
      );
      setStatusMessage(
        nextAction === "publish"
          ? "Artigo publicado no seu blog."
          : "Artigo despublicado e movido para rascunhos.",
      );
    } catch (err) {
      setError(err?.message || "Não foi possível alterar o status do artigo.");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleToggleFeatured(post) {
    const nextAction = post.featured ? "unfeature" : "feature";
    setBusyPostId(post._id);
    setError("");
    setStatusMessage("");
    try {
      const result = await requestJson(
        `/api/blogs/publicacoes/${post._id}`,
        jsonRequest("PATCH", { action: nextAction }),
      );
      setPosts((current) =>
        current.map((item) => {
          if (item._id === result.post._id) return result.post;
          if (result.post.featured) return { ...item, featured: false };
          return item;
        }),
      );
      setStatusMessage(
        nextAction === "feature"
          ? "Artigo marcado como destaque no seu blog."
          : "Destaque removido do artigo.",
      );
    } catch (err) {
      setError(err?.message || "Não foi possível atualizar o destaque.");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleDeletePost(post) {
    setBusyPostId(post._id);
    setError("");
    setStatusMessage("");
    try {
      await requestJson(
        `/api/blogs/publicacoes/${post._id}`,
        jsonRequest("DELETE", {}),
      );
      setPosts((current) => current.filter((item) => item._id !== post._id));
      if (editingPostId === post._id) {
        resetPostEditor();
      }
      setStatusMessage("Publicação excluída com sucesso.");
    } catch (err) {
      setError(err?.message || "Não foi possível excluir a publicação.");
    } finally {
      setBusyPostId(null);
    }
  }

  const previewSlug = blogSlug || slugifyText(blogName, 60) || "meu-blog";
  const authorDisplayName =
    session?.user?.name || blog?.authorName || "Autor do Blog";
  const authorAvatarUrl =
    session?.user?.image || blog?.authorAvatar || DEFAULT_AUTHOR_AVATAR;

  return (
    <PrayerLayout
      title="Meu Blog — Blog | Caminhar para Cristo"
      description="Painel editorial do Blog na comunidade Caminhar para Cristo."
    >
      <div className="p-container pl-blogs-page pl-owner-blog-page">
        <header className="p-page-head pl-blogs-hero">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/blogs">Blog</Link>
            <span>/</span>
            Meu blog
          </div>
          <p className="p-eyebrow">
            <span aria-hidden="true" />
            ESCRITA E PARTILHA CRISTÃ
          </p>
          <h1>{blog ? blog.name : "Seu espaço de escrita e reflexão"}</h1>
          <p className="pl-blogs-lead">
            {blog
              ? blog.description
              : "Compartilhe reflexões bíblicas, testemunhos, estudos, orações autorais e vivências da caminhada com Cristo."}
          </p>
        </header>

        {!session && status !== "loading" ? (
          <section className="p-panel p-empty pl-blogs-empty">
            <Icon name="lock" size={28} />
            <h2>Entre na sua conta para acessar o painel editorial do Blog.</h2>
            <p>
              A publicação de textos no Blog é reservada aos autores autorizados
              da plataforma.
            </p>
            <div className="p-actions" style={{ justifyContent: "center" }}>
              <Link href="/login" className="p-button">
                Entrar na minha conta
              </Link>
              <Link href="/blogs" className="p-button p-button-outline">
                Ler artigos no Blog
              </Link>
            </div>
          </section>
        ) : session && !canPublish ? (
          <section className="p-panel p-empty pl-blogs-empty">
            <Icon name="book" size={28} />
            <h2>Área editorial restrita aos autores do Blog</h2>
            <p>
              O Blog é público para leitura e compartilhamento, mas a publicação
              de artigos é restrita às contas editoriais autorizadas.
            </p>
            <div className="p-actions" style={{ justifyContent: "center" }}>
              <Link href="/blogs" className="p-button">
                Ler artigos no Blog
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          </section>
        ) : loading ? (
          <p className="p-loading" role="status">
            Carregando seu espaço de escrita…
          </p>
        ) : (
          <>
            {error ? (
              <div className="p-notice pl-blogs-notice" role="alert">
                <p>{error}</p>
              </div>
            ) : null}

            {statusMessage ? (
              <div className="p-notice pl-blogs-status" role="status">
                <p>{statusMessage}</p>
              </div>
            ) : null}

            {!blog || editingBlogInfo ? (
              <section
                className="p-panel pl-blog-setup-panel"
                aria-labelledby="blog-setup-heading"
              >
                <div className="pl-blog-setup-head">
                  <div className="pl-blog-setup-head-row">
                    <div>
                      <p className="p-eyebrow">
                        {blog
                          ? "CONFIGURAÇÕES DO BLOG"
                          : "CADASTRO DO BLOG PESSOAL"}
                      </p>
                      <h2 id="blog-setup-heading">
                        {blog
                          ? "Editar informações do seu blog"
                          : "Criar meu blog pessoal"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="p-button p-button-outline"
                      onClick={() => setPreviewBlogMode((v) => !v)}
                    >
                      {previewBlogMode
                        ? "Voltar à edição do blog"
                        : "Pré-visualizar blog"}
                    </button>
                  </div>
                  <p>
                    Cada membro pode possuir um único blog com nome e endereço
                    exclusivos na comunidade.
                  </p>
                </div>

                {previewBlogMode ? (
                  <div
                    className="pl-blog-preview-box pl-blog-magazine-header"
                    aria-label="Pré-visualização do blog"
                  >
                    <div className="pl-blog-magazine-cover">
                      <Image
                        unoptimized
                        src={blogCoverImage || DEFAULT_BLOG_COVER_IMAGE}
                        alt="Capa do blog"
                        width={1600}
                        height={600}
                        className="pl-blog-magazine-cover-img"
                      />
                    </div>
                    <div className="pl-blog-magazine-hero-body">
                      <div className="pl-blog-magazine-author-strip">
                        <Image
                          unoptimized
                          src={authorAvatarUrl}
                          alt={authorDisplayName}
                          width={56}
                          height={56}
                          className="pl-blog-author-avatar"
                        />
                        <div>
                          <p className="p-eyebrow">POR {authorDisplayName}</p>
                          <p className="pl-blog-author-strip-bio">
                            {blogAuthorBio ||
                              "Apresentação do autor aparecerá aqui."}
                          </p>
                        </div>
                      </div>
                      <h3>{blogName || "Nome do seu blog"}</h3>
                      <p className="pl-blogs-lead">
                        {blogDescription ||
                          "Descrição curta do propósito e dos temas do seu blog."}
                      </p>
                    </div>
                  </div>
                ) : null}

                <form className="p-form-stack" onSubmit={handleSaveBlog}>
                  {/* Seção: Identidade visual */}
                  <fieldset className="pl-blog-identity-section">
                    <legend id="blog-visual-identity-heading">
                      Identidade visual
                    </legend>
                    <p className="p-muted">
                      Personalize a capa editorial do seu blog. A foto do autor
                      utiliza automaticamente a foto cadastrada no seu perfil.
                    </p>
                    <BlogCoverUploader
                      id="blog-cover-uploader"
                      label="Imagem de capa do blog"
                      value={blogCoverImage}
                      onChange={setBlogCoverImage}
                      disabled={savingBlog}
                    />
                  </fieldset>

                  <div className="p-field">
                    <label htmlFor="blog-name">Nome do blog</label>
                    <input
                      id="blog-name"
                      type="text"
                      required
                      minLength={3}
                      maxLength={80}
                      value={blogName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex.: Caminhos de Fé"
                    />
                    <small>
                      {blogName.length}/80 caracteres · Deve ser único.
                    </small>
                  </div>

                  <div className="p-field">
                    <label htmlFor="blog-slug">
                      Identificador exclusivo (endereço do blog)
                    </label>
                    <div className="pl-blog-slug-row">
                      <input
                        id="blog-slug"
                        type="text"
                        required
                        minLength={3}
                        maxLength={60}
                        value={blogSlug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="caminhos-de-fe"
                      />
                      <button
                        type="button"
                        className="p-button p-button-outline"
                        disabled={checkingAvailability || !blogName.trim()}
                        onClick={checkAvailability}
                      >
                        {checkingAvailability
                          ? "Verificando…"
                          : "Verificar disponibilidade"}
                      </button>
                    </div>
                    <small>
                      Endereço público: <strong>/blogs/{previewSlug}</strong>
                    </small>
                    {availabilityStatus ? (
                      <p
                        className={
                          availabilityStatus.available
                            ? "pl-blog-availability is-available"
                            : "pl-blog-availability is-unavailable"
                        }
                        role="status"
                      >
                        {availabilityStatus.available
                          ? "Nome e endereço disponíveis!"
                          : availabilityStatus.reason}
                      </p>
                    ) : null}
                  </div>

                  <div className="p-field">
                    <label htmlFor="blog-description">Descrição curta</label>
                    <textarea
                      id="blog-description"
                      required
                      minLength={10}
                      maxLength={320}
                      rows={3}
                      value={blogDescription}
                      onChange={(e) => setBlogDescription(e.target.value)}
                      placeholder="Apresente brevemente o propósito e os temas das suas reflexões…"
                    />
                    <small>{blogDescription.length}/320 caracteres</small>
                  </div>

                  <div className="p-field">
                    <label htmlFor="blog-author-bio">
                      Apresentação do autor
                    </label>
                    <textarea
                      id="blog-author-bio"
                      required
                      minLength={10}
                      maxLength={600}
                      rows={3}
                      value={blogAuthorBio}
                      onChange={(e) => setBlogAuthorBio(e.target.value)}
                      placeholder="Conte um pouco sobre sua caminhada de fé e vocação…"
                    />
                    <small>{blogAuthorBio.length}/600 caracteres</small>
                  </div>

                  <div className="p-actions">
                    <button
                      type="submit"
                      className="p-button"
                      disabled={savingBlog}
                    >
                      {savingBlog
                        ? "Salvando…"
                        : blog
                          ? "Salvar alterações"
                          : "Concluir cadastro do blog"}
                    </button>
                    {blog ? (
                      <button
                        type="button"
                        className="p-button p-button-outline"
                        onClick={() => {
                          setEditingBlogInfo(false);
                          setPreviewBlogMode(false);
                        }}
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>
            ) : null}

            {blog ? (
              <>
                <section
                  className="p-panel pl-owner-summary-bar"
                  aria-label="Resumo do blog"
                >
                  <div>
                    <span className="p-eyebrow">ENDEREÇO PÚBLICO</span>
                    <p className="pl-owner-slug-path">/blogs/{blog.slug}</p>
                  </div>
                  <div className="p-actions pl-owner-summary-actions">
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="p-button p-button-outline"
                    >
                      Ver blog público
                      <Icon name="arrow" size={16} />
                    </Link>
                    <button
                      type="button"
                      className="p-button p-button-outline"
                      onClick={() => setEditingBlogInfo((value) => !value)}
                    >
                      {editingBlogInfo
                        ? "Fechar configurações"
                        : "Editar nome e descrição"}
                    </button>
                    <button
                      type="button"
                      className="p-button"
                      onClick={() => {
                        resetPostEditor();
                        setEditorOpen(true);
                      }}
                    >
                      Nova publicação
                    </button>
                  </div>
                </section>

                <div className="pl-owner-workspace">
                  {editorOpen ? (
                    <section
                      className="p-panel pl-blog-editor-panel"
                      aria-labelledby="editor-heading"
                    >
                      <div className="pl-blog-editor-head">
                        <div>
                          <p className="p-eyebrow">
                            {editingPostId
                              ? "EDITANDO PUBLICAÇÃO"
                              : "NOVA PUBLICAÇÃO"}
                          </p>
                          <h2 id="editor-heading">
                            {editingPostId
                              ? "Editar texto"
                              : "Escrever novo artigo"}
                          </h2>
                        </div>
                        <button
                          type="button"
                          className="p-button p-button-outline"
                          onClick={() => setPreviewMode((value) => !value)}
                        >
                          {previewMode
                            ? "Voltar à escrita"
                            : "Pré-visualizar publicação"}
                        </button>
                      </div>

                      {previewMode ? (
                        <div className="pl-blog-preview-box">
                          {postCoverImage ? (
                            <div className="pl-blog-article-cover">
                              <Image
                                unoptimized
                                src={postCoverImage}
                                alt={postTitle || "Capa do artigo"}
                                width={1200}
                                height={480}
                                className="pl-blog-article-cover-img"
                              />
                            </div>
                          ) : null}
                          <span className="p-eyebrow">{postCategory}</span>
                          <h3>{postTitle || "Título da publicação"}</h3>
                          {postSubtitle ? (
                            <p className="pl-blog-article-subtitle">
                              {postSubtitle}
                            </p>
                          ) : null}
                          <BlogContentRenderer
                            content={
                              postContent ||
                              "Escreva seu texto para visualizar a formatação do artigo."
                            }
                          />
                        </div>
                      ) : (
                        <div className="p-form-stack">
                          <div className="p-field">
                            <label htmlFor="post-title">Título</label>
                            <input
                              id="post-title"
                              type="text"
                              required
                              minLength={3}
                              maxLength={140}
                              className="pl-blog-title-input"
                              value={postTitle}
                              onChange={(e) => setPostTitle(e.target.value)}
                              placeholder="Um título claro e acolhedor para sua reflexão"
                            />
                          </div>

                          <div className="pl-blog-editor-meta-row">
                            <div className="p-field">
                              <label htmlFor="post-subtitle">
                                Subtítulo (opcional)
                              </label>
                              <input
                                id="post-subtitle"
                                type="text"
                                maxLength={220}
                                value={postSubtitle}
                                onChange={(e) =>
                                  setPostSubtitle(e.target.value)
                                }
                                placeholder="Uma frase breve que complementa o título"
                              />
                            </div>

                            <div className="p-field">
                              <label htmlFor="post-category">Categoria</label>
                              <select
                                id="post-category"
                                value={postCategory}
                                onChange={(e) =>
                                  setPostCategory(e.target.value)
                                }
                              >
                                {BLOG_CATEGORIES.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="pl-blog-editor-meta-row">
                            <div className="p-field">
                              <label htmlFor="post-tags">
                                Tags (opcional, separadas por vírgula)
                              </label>
                              <input
                                id="post-tags"
                                type="text"
                                maxLength={220}
                                value={postTagsInput}
                                onChange={(e) =>
                                  setPostTagsInput(e.target.value)
                                }
                                placeholder="Ex.: oração, liturgia, contemplação"
                              />
                            </div>

                            <div className="p-field pl-blog-featured-toggle">
                              <label htmlFor="post-featured">
                                Destaque no blog
                              </label>
                              <label className="pl-blog-checkbox-label">
                                <input
                                  id="post-featured"
                                  type="checkbox"
                                  checked={postFeatured}
                                  onChange={(e) =>
                                    setPostFeatured(e.target.checked)
                                  }
                                />
                                <span>Destacar artigo no topo do blog</span>
                              </label>
                            </div>
                          </div>

                          <BlogCoverUploader
                            id="post-cover-uploader"
                            label="Imagem de capa do artigo (opcional)"
                            value={postCoverImage}
                            onChange={setPostCoverImage}
                            disabled={savingPost}
                          />

                          <div className="p-field">
                            <div className="pl-blog-format-bar">
                              <span>Conteúdo</span>
                              <div
                                className="pl-blog-format-buttons"
                                role="toolbar"
                                aria-label="Formatação básica de texto"
                              >
                                <button
                                  type="button"
                                  className="p-font-button"
                                  onClick={() => insertFormatting("h2")}
                                  title="Inserir título de seção H2"
                                >
                                  H2
                                </button>
                                <button
                                  type="button"
                                  className="p-font-button"
                                  onClick={() => insertFormatting("h3")}
                                  title="Inserir subtítulo H3"
                                >
                                  H3
                                </button>
                                <button
                                  type="button"
                                  className="p-font-button"
                                  onClick={() => insertFormatting("bold")}
                                  title="Inserir negrito"
                                >
                                  <strong>Negrito</strong>
                                </button>
                                <button
                                  type="button"
                                  className="p-font-button"
                                  onClick={() => insertFormatting("italic")}
                                  title="Inserir itálico"
                                >
                                  <em>Itálico</em>
                                </button>
                                <button
                                  type="button"
                                  className="p-font-button"
                                  onClick={() => insertFormatting("list")}
                                  title="Inserir lista"
                                >
                                  Lista
                                </button>
                              </div>
                            </div>

                            <textarea
                              id="post-content"
                              ref={contentRef}
                              rows={14}
                              required
                              minLength={20}
                              maxLength={30000}
                              className="pl-blog-content-textarea"
                              value={postContent}
                              onChange={(e) => setPostContent(e.target.value)}
                              placeholder="Escreva com tranquilidade. Separe parágrafos com uma linha em branco. Use ## para títulos H2, ### para subtítulos H3, **negrito**, *itálico* ou '- ' para listas."
                            />
                            <small>
                              {postContent.length}/30.000 caracteres · Separe
                              parágrafos com uma linha em branco. Títulos H2 e
                              H3 geram sumário automático.
                            </small>
                          </div>
                        </div>
                      )}

                      <div className="p-actions pl-blog-editor-actions">
                        <button
                          type="button"
                          className="p-button p-button-outline"
                          disabled={savingPost}
                          onClick={() => handleSavePost("draft")}
                        >
                          Salvar rascunho
                        </button>
                        <button
                          type="button"
                          className="p-button"
                          disabled={savingPost}
                          onClick={() => handleSavePost("published")}
                        >
                          {editingPostId
                            ? "Salvar e publicar"
                            : "Publicar artigo"}
                        </button>
                        {editingPostId ? (
                          <button
                            type="button"
                            className="p-inline-button"
                            onClick={resetPostEditor}
                          >
                            Cancelar edição
                          </button>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  <section
                    className="p-panel pl-owner-posts-panel"
                    aria-labelledby="owner-posts-heading"
                  >
                    <div className="pl-owner-posts-head">
                      <div>
                        <p className="p-eyebrow">SEUS TEXTOS</p>
                        <h2 id="owner-posts-heading">
                          Publicações e rascunhos ({posts.length})
                        </h2>
                      </div>
                    </div>

                    {posts.length === 0 ? (
                      <div className="p-empty">
                        <p>
                          Você ainda não escreveu nenhum texto no seu blog. Use
                          o editor para salvar um rascunho ou publicar seu
                          primeiro artigo.
                        </p>
                      </div>
                    ) : (
                      <ul className="pl-owner-post-list">
                        {posts.map((post) => (
                          <li key={post._id} className="pl-owner-post-item">
                            <div className="pl-owner-post-main">
                              <div className="pl-owner-post-badges">
                                <span
                                  className={`pl-post-status-pill is-${post.status}`}
                                >
                                  {post.status === "published"
                                    ? "Publicado"
                                    : post.status === "hidden"
                                      ? "Oculto pela moderação"
                                      : "Rascunho"}
                                </span>
                                <span className="pl-post-category-pill">
                                  {post.category}
                                </span>
                                {post.featured ? (
                                  <span className="pl-post-category-pill">
                                    Em destaque
                                  </span>
                                ) : null}
                                <span className="pl-post-date">
                                  {post.publishedAt
                                    ? `Publicado em ${formatPrayerDate(post.publishedAt, { year: "numeric" })}`
                                    : `Atualizado em ${formatPrayerDate(post.updatedAt, { year: "numeric" })}`}
                                </span>
                              </div>

                              <h3>{post.title}</h3>
                              {post.subtitle ? <p>{post.subtitle}</p> : null}
                            </div>

                            <div className="pl-owner-post-actions">
                              {post.status === "published" ? (
                                <Link
                                  href={`/blogs/${blog.slug}/${post.slug}`}
                                  className="p-button p-button-outline"
                                >
                                  Ver artigo
                                </Link>
                              ) : null}
                              <button
                                type="button"
                                className="p-button p-button-outline"
                                disabled={busyPostId === post._id}
                                onClick={() => startEditPost(post)}
                              >
                                Editar
                              </button>
                              {post.status === "published" ? (
                                <button
                                  type="button"
                                  className="p-button p-button-outline"
                                  disabled={busyPostId === post._id}
                                  onClick={() => handleToggleFeatured(post)}
                                >
                                  {post.featured
                                    ? "Remover destaque"
                                    : "Destacar"}
                                </button>
                              ) : null}
                              {post.status !== "hidden" ? (
                                <button
                                  type="button"
                                  className="p-button p-button-outline"
                                  disabled={busyPostId === post._id}
                                  onClick={() => handleTogglePostStatus(post)}
                                >
                                  {post.status === "published"
                                    ? "Despublicar"
                                    : "Publicar"}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="p-inline-button pl-delete-post-button"
                                disabled={busyPostId === post._id}
                                onClick={() => handleDeletePost(post)}
                              >
                                Excluir
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </>
            ) : null}
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
