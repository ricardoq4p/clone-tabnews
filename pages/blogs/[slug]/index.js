import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import { requestJson, formatPrayerDate } from "@/lib/client";
import {
  BLOG_CATEGORIES,
  BLOG_INSTITUTIONAL_DISCLAIMER,
  DEFAULT_AUTHOR_AVATAR,
  DEFAULT_BLOG_COVER_IMAGE,
  estimateReadingTimeMinutes,
} from "@/lib/blogs";

export default function PublicBlogPage({
  initialBlog = null,
  initialPosts = [],
  initialFeaturedPost = null,
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
  const [featuredPostState, setFeaturedPostState] =
    useState(initialFeaturedPost);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(!initialLoaded);
  const [error, setError] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");

  // Navegação editorial (busca, categoria, tag)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const loadBlog = useCallback(
    (
      targetPage = 1,
      overrideSearch = searchQuery,
      overrideCategory = selectedCategory,
      overrideTag = selectedTag,
    ) => {
      if (!slug) return Promise.resolve();
      const params = new URLSearchParams({
        page: String(targetPage),
      });
      if (overrideSearch.trim()) params.set("q", overrideSearch.trim());
      if (overrideCategory) params.set("category", overrideCategory);
      if (overrideTag) params.set("tag", overrideTag);

      return requestJson(
        `/api/blogs/${encodeURIComponent(slug)}?${params.toString()}`,
      )
        .then((result) => {
          setError("");
          setBlog(result.blog);
          setPosts(Array.isArray(result.posts) ? result.posts : []);
          setFeaturedPostState(result.featuredPost || null);
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
    [slug, searchQuery, selectedCategory, selectedTag],
  );

  useEffect(() => {
    if (initialLoaded || !slug) return;
    loadBlog(page, searchQuery, selectedCategory, selectedTag);
  }, [
    slug,
    page,
    searchQuery,
    selectedCategory,
    selectedTag,
    initialLoaded,
    loadBlog,
  ]);

  async function handleShareBlog() {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    const shareTitle = blog?.name
      ? `${blog.name} — Blog Caminhar para Cristo`
      : "Blog Caminhar para Cristo";
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
        setShareFeedback("Link do blog compartilhado.");
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback("Link do blog copiado para compartilhar.");
        return;
      }
    } catch {
      /* ignore share cancellation */
    }
  }

  // Filtragem local instantânea além da busca na API
  const filteredPosts = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      if (selectedCategory && post.category !== selectedCategory) return false;
      if (
        selectedTag &&
        !(Array.isArray(post.tags) && post.tags.includes(selectedTag))
      ) {
        return false;
      }
      if (qLower) {
        const haystack = [
          post.title,
          post.subtitle,
          post.excerpt,
          ...(post.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(qLower)) return false;
      }
      return true;
    });
  }, [posts, searchQuery, selectedCategory, selectedTag]);

  // Artigo em destaque: manual (featured === true) ou automaticamente a publicação mais recente
  const featuredPost = useMemo(() => {
    if (featuredPostState) return featuredPostState;
    const manual = posts.find((item) => item.featured);
    return manual || posts[0] || null;
  }, [featuredPostState, posts]);

  const allTags = useMemo(() => {
    return Array.from(
      new Set(posts.flatMap((post) => post.tags || []).filter(Boolean)),
    );
  }, [posts]);

  const relatedSuggestions = useMemo(() => {
    if (!featuredPost) return posts.slice(0, 3);
    return posts
      .filter(
        (item) =>
          (item._id || item.slug) !== (featuredPost._id || featuredPost.slug),
      )
      .slice(0, 3);
  }, [posts, featuredPost]);

  const seoTitle = blog
    ? `${blog.name} — Vozes da Comunidade | Caminhar para Cristo`
    : "Blog da Comunidade | Caminhar para Cristo";
  const seoDescription =
    blog?.description ||
    "Reflexões, estudos e testemunhos na caminhada com Cristo.";
  const coverUrl = blog?.coverImage || DEFAULT_BLOG_COVER_IMAGE;
  const authorAvatarUrl = blog?.authorAvatar || DEFAULT_AUTHOR_AVATAR;

  return (
    <PrayerLayout
      title={seoTitle}
      description={seoDescription}
      image={blog?.coverImage || ""}
    >
      <div className="p-container pl-blogs-page pl-public-blog-page">
        <div className="p-breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <Link href="/blogs">Blog</Link>
          <span>/</span>
          {blog?.name || "Blog"}
        </div>

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
            {/* 1. Cabeçalho editorial */}
            <header
              className="p-panel pl-blog-magazine-header"
              aria-label="Cabeçalho editorial do blog"
            >
              <div className="pl-blog-magazine-cover">
                <Image
                  unoptimized
                  src={coverUrl}
                  alt={`Capa do blog ${blog.name}`}
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
                    alt={`Foto de ${blog.authorName || "Autor"}`}
                    width={56}
                    height={56}
                    className="pl-blog-author-avatar"
                  />
                  <div>
                    <p className="p-eyebrow">
                      <span aria-hidden="true" />
                      POR {blog.authorName || "Membro da comunidade"}
                    </p>
                    <p className="pl-blog-author-strip-bio">{blog.authorBio}</p>
                  </div>
                </div>

                <h1>{blog.name}</h1>
                <p className="pl-blogs-lead">{blog.description}</p>

                <div className="p-actions pl-blog-magazine-actions">
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    onClick={handleShareBlog}
                  >
                    Compartilhar blog
                  </button>
                  {blog.isOwner ? (
                    <Link
                      href="/meu-blog"
                      className="p-button p-button-outline"
                    >
                      Administrar meu blog
                    </Link>
                  ) : null}
                </div>
                {shareFeedback ? (
                  <p role="status" className="p-muted">
                    {shareFeedback}
                  </p>
                ) : null}
              </div>
            </header>

            {/* 2. Artigo em destaque */}
            {featuredPost ? (
              <section
                className="p-panel pl-blog-featured-section"
                aria-label="Artigo em destaque"
              >
                <div className="pl-blog-featured-media">
                  <Link href={`/blogs/${blog.slug}/${featuredPost.slug}`}>
                    <Image
                      unoptimized
                      src={
                        featuredPost.coverImage ||
                        blog.coverImage ||
                        DEFAULT_BLOG_COVER_IMAGE
                      }
                      alt={featuredPost.title}
                      width={960}
                      height={520}
                      className="pl-blog-featured-img"
                    />
                  </Link>
                </div>

                <div className="pl-blog-featured-content">
                  <div className="pl-blog-post-meta">
                    <span className="p-eyebrow">ARTIGO EM DESTAQUE</span>
                    <span>·</span>
                    <span className="pl-post-category-pill">
                      {featuredPost.category}
                    </span>
                    {featuredPost.publishedAt ? (
                      <>
                        <span>·</span>
                        <time dateTime={String(featuredPost.publishedAt)}>
                          {formatPrayerDate(featuredPost.publishedAt, {
                            year: "numeric",
                          })}
                        </time>
                      </>
                    ) : null}
                    <span>·</span>
                    <span>
                      {featuredPost.readingTimeMinutes ||
                        estimateReadingTimeMinutes(
                          featuredPost.excerpt || "",
                        )}{" "}
                      min de leitura
                    </span>
                  </div>

                  <h2>
                    <Link href={`/blogs/${blog.slug}/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>

                  {featuredPost.subtitle ? (
                    <p className="pl-blog-post-subtitle">
                      {featuredPost.subtitle}
                    </p>
                  ) : null}

                  {featuredPost.excerpt ? (
                    <p className="pl-blog-post-excerpt">
                      {featuredPost.excerpt}
                    </p>
                  ) : null}

                  <Link
                    href={`/blogs/${blog.slug}/${featuredPost.slug}`}
                    className="p-button"
                  >
                    Ler artigo em destaque
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              </section>
            ) : null}

            {/* 3. Navegação editorial (Busca, Categorias e Tags) */}
            <section
              className="p-panel pl-blog-editorial-nav"
              aria-label="Navegação editorial e filtros"
            >
              <div className="pl-blog-search-row">
                <label htmlFor="blog-article-search" className="sr-only">
                  Buscar artigos
                </label>
                <input
                  id="blog-article-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar artigos por título, tema ou palavra-chave…"
                  className="pl-blog-search-input"
                />
                {(searchQuery || selectedCategory || selectedTag) && (
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("");
                      setSelectedTag("");
                    }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              <div
                className="pl-blog-category-filters"
                role="group"
                aria-label="Filtrar por categoria"
              >
                <button
                  type="button"
                  className={`pl-blog-filter-chip ${!selectedCategory ? "is-active" : ""}`}
                  aria-pressed={!selectedCategory}
                  onClick={() => setSelectedCategory("")}
                >
                  Todas as categorias
                </button>
                {BLOG_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`pl-blog-filter-chip ${selectedCategory === category ? "is-active" : ""}`}
                    aria-pressed={selectedCategory === category}
                    onClick={() =>
                      setSelectedCategory((curr) =>
                        curr === category ? "" : category,
                      )
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>

              {allTags.length > 0 ? (
                <div
                  className="pl-blog-tag-filters"
                  aria-label="Filtrar por tag"
                >
                  <span className="p-eyebrow">TAGS:</span>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`pl-blog-tag-chip ${selectedTag === tag ? "is-active" : ""}`}
                      aria-pressed={selectedTag === tag}
                      onClick={() =>
                        setSelectedTag((curr) => (curr === tag ? "" : tag))
                      }
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            {/* 4. Grade de publicações */}
            <section
              className="pl-blog-posts-section"
              aria-labelledby="public-posts-heading"
            >
              <div className="pl-blog-section-head">
                <span className="p-eyebrow">PUBLICAÇÕES</span>
                <h2 id="public-posts-heading">Textos publicados</h2>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="p-panel p-empty">
                  <p>
                    {posts.length === 0
                      ? "Este blog ainda não possui publicações abertas ao público."
                      : "Nenhum artigo encontrado para os filtros selecionados."}
                  </p>
                </div>
              ) : (
                <div className="pl-blog-post-list pl-blog-posts-grid">
                  {filteredPosts.map((post) => {
                    const postCover =
                      post.coverImage ||
                      blog.coverImage ||
                      DEFAULT_BLOG_COVER_IMAGE;
                    const readingMinutes =
                      post.readingTimeMinutes ||
                      estimateReadingTimeMinutes(post.excerpt || "");
                    return (
                      <article
                        key={post._id || post.slug}
                        className="p-panel pl-blog-post-card"
                      >
                        <Link
                          href={`/blogs/${blog.slug}/${post.slug}`}
                          className="pl-blog-post-card-cover"
                        >
                          <Image
                            unoptimized
                            src={postCover}
                            alt={post.title}
                            width={640}
                            height={320}
                            className="pl-blog-post-card-img"
                          />
                        </Link>

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
                          <span>·</span>
                          <span>{readingMinutes} min de leitura</span>
                        </div>

                        <h3>
                          <Link href={`/blogs/${blog.slug}/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>

                        {post.subtitle ? (
                          <p className="pl-blog-post-subtitle">
                            {post.subtitle}
                          </p>
                        ) : null}

                        {post.excerpt ? (
                          <p className="pl-blog-post-excerpt">{post.excerpt}</p>
                        ) : null}

                        {Array.isArray(post.tags) && post.tags.length > 0 ? (
                          <div className="pl-blog-post-tags">
                            {post.tags.map((tag) => (
                              <span key={tag} className="pl-blog-tag-chip">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <Link
                          href={`/blogs/${blog.slug}/${post.slug}`}
                          className="p-text-link"
                        >
                          Ler publicação
                          <Icon name="arrow" size={16} />
                        </Link>
                      </article>
                    );
                  })}
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

            {/* Artigos relacionados / Sugestões de leitura */}
            {relatedSuggestions.length > 0 ? (
              <section
                className="p-panel pl-blog-related-section"
                aria-label="Artigos relacionados"
              >
                <span className="p-eyebrow">CONTINUAR LEITURA</span>
                <h2>Artigos relacionados</h2>
                <div className="pl-blog-related-grid">
                  {relatedSuggestions.map((item) => (
                    <article
                      key={item._id || item.slug}
                      className="pl-blog-related-card"
                    >
                      <span className="pl-post-category-pill">
                        {item.category}
                      </span>
                      <h3>
                        <Link href={`/blogs/${blog.slug}/${item.slug}`}>
                          {item.title}
                        </Link>
                      </h3>
                      <span className="p-muted">
                        {item.readingTimeMinutes || 1} min de leitura
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 5. Seção sobre o autor */}
            <aside
              className="p-panel pl-blog-author-card"
              aria-label="Apresentação do autor"
            >
              <div className="pl-blog-author-card-grid">
                <Image
                  unoptimized
                  src={authorAvatarUrl}
                  alt={`Foto de ${blog.authorName || "Autor"}`}
                  width={84}
                  height={84}
                  className="pl-blog-author-avatar-lg"
                />
                <div>
                  <span className="p-eyebrow">SOBRE O AUTOR</span>
                  <h2>{blog.authorName}</h2>
                  <p>{blog.authorBio}</p>
                  <div className="pl-blog-author-purpose">
                    <strong>Propósito de {blog.name}:</strong>{" "}
                    <span>{blog.description}</span>
                  </div>
                </div>
              </div>
            </aside>

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
