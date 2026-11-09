import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mockUseRouter = jest.fn();
const mockUseSession = jest.fn();

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
jest.mock("../lib/models/Blog", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("../lib/models/BlogPost", () => ({
  __esModule: true,
  BLOG_POST_CATEGORIES: [
    "Bíblia e Estudos",
    "Testemunhos",
    "Vida Cristã",
    "Orações",
    "Espiritualidade",
    "Família",
    "Reflexões",
  ],
  default: {
    init: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    deleteOne: jest.fn(),
    aggregate: jest.fn(),
  },
}));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter(),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: jest.fn(),
}));
jest.mock("next/font/local", () => () => ({
  variable: "mock-font-var",
}));
jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }) =>
    React.createElement("div", { "data-testid": "next-head" }, children),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) =>
    React.createElement("img", {
      src: props.src,
      alt: props.alt || "",
      width: props.width,
      height: props.height,
    }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, className, "aria-current": ariaCurrent, children }) =>
    React.createElement(
      "a",
      { href, className, "aria-current": ariaCurrent },
      children,
    ),
}));

import { getServerSession } from "next-auth";
import Blog from "../lib/models/Blog";
import BlogPost from "../lib/models/BlogPost";
import User from "../lib/models/User";
import {
  AUTHORIZED_BLOG_AUTHOR_EMAILS,
  BLOG_CATEGORIES,
  BLOG_INSTITUTIONAL_DISCLAIMER,
  DEFAULT_AUTHOR_AVATAR,
  DEFAULT_BLOG_COVER_IMAGE,
  detectImageFormatFromBytes,
  estimateReadingTimeMinutes,
  extractBlogHeadings,
  hasValidImageMagicBytes,
  normalizeBlogName,
  normalizeBlogTags,
  shouldShowBlogTableOfContents,
  slugifyText,
  isReservedBlogIdentifier,
  validateBlogCoverDimensions,
  validateBlogCoverUrl,
  validateBlogInput,
  validateBlogPostInput,
  sanitizeBlogPostContent,
  parseBlogContentBlocks,
  canPublishInBlog,
  canManageBlog,
  canManageBlogPost,
  canReadPublicBlogPost,
} from "../lib/blogs";
import BlogCoverUploader from "../components/BlogCoverUploader";
import blogsApi from "../pages/api/blogs/index";
import disponibilidadeApi from "../pages/api/blogs/disponibilidade";
import meuBlogApi from "../pages/api/blogs/meu";
import publicacoesApi from "../pages/api/blogs/publicacoes/index";
import publicacaoDetailApi from "../pages/api/blogs/publicacoes/[id]";
import publicBlogApi from "../pages/api/blogs/[slug]/index";
import publicPostApi from "../pages/api/blogs/[slug]/[post]";
import BlogsDirectory from "../pages/blogs/index";
import BlogAliasPage from "../pages/blog";
import MeuBlogPage from "../pages/meu-blog";
import PublicBlogPage from "../pages/blogs/[slug]/index";
import PublicBlogPostPage from "../pages/blogs/[slug]/[post]";

const ownerId = "65a111111111111111111111";
const ricardoSecondId = "65a111111111111111111112";
const fernandaId = "65a111111111111111111113";
const superAdminId = "65a999999999999999999999";
const otherUserId = "65a222222222222222222222";
const blogId = "65a333333333333333333333";
const postId = "65a444444444444444444444";

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  User.findOne.mockReset();
  User.findById.mockReset();
  process.env.MONGODB_URI = "mongodb://127.0.0.1/isolated-test-never-connected";
  getServerSession.mockResolvedValue({
    user: {
      id: ownerId,
      name: "Ricardo",
      email: "ricardosumo1000@gmail.com",
      role: "user",
    },
  });
  mockUseSession.mockReturnValue({
    data: {
      user: {
        id: ownerId,
        name: "Ricardo",
        email: "ricardosumo1000@gmail.com",
        role: "user",
      },
    },
    status: "authenticated",
  });
  mockUseRouter.mockReturnValue({
    pathname: "/blogs",
    asPath: "/blogs",
    query: {},
  });
});

afterEach(() => {
  delete process.env.MONGODB_URI;
});

describe("Domínio de Blogs — Normalização, Slugs, Identificadores Reservados e Sanitização", () => {
  test("normaliza nomes com acentos, maiúsculas e espaços extras e gera slugs limpos", () => {
    expect(normalizeBlogName("  Caminhos   de Fé! ")).toBe("caminhos de fe");
    expect(normalizeBlogName("CAMINHOS DE FE")).toBe("caminhos de fe");
    expect(slugifyText("Caminhos de Fé")).toBe("caminhos-de-fe");
    expect(slugifyText("Oração & Esperança Cristã")).toBe(
      "oracao-esperanca-crista",
    );
  });

  test("bloqueia nomes e identificadores reservados pelo sistema", () => {
    for (const reserved of [
      "admin",
      "ADMIN",
      "api",
      "login",
      "register",
      "blogs",
      "meu-blog",
      "oratorio",
      "capelinha",
    ]) {
      expect(isReservedBlogIdentifier(reserved)).toBe(true);
      const result = validateBlogInput({
        name: reserved === "api" ? "API" : reserved,
        slug: reserved.toLowerCase(),
        description: "Descrição válida para teste de reserva.",
        authorBio: "Biografia válida para teste de reserva.",
      });
      expect(result.ok).toBe(false);
    }
  });

  test("sanitiza conteúdo contra XSS preservando parágrafos, negrito, itálico e listas", () => {
    const raw =
      '<script>alert("xss")</script>Reflexão em **negrito** e *itálico*.\n\n- Primeiro item\n- Segundo item <img src=x onerror=alert(1)>';
    const clean = sanitizeBlogPostContent(raw);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("<img");
    expect(clean).not.toContain("onerror=");
    expect(clean).toContain("Reflexão em **negrito** e *itálico*.");

    const blocks = parseBlogContentBlocks(clean);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[1].type).toBe("ul");
    expect(blocks[1].items).toHaveLength(2);
  });
});

describe("APIs de Blogs — Criação, Unicidade, Propriedade e Publicações", () => {
  test("bloqueia criação de blog para visitante não autenticado (401)", async () => {
    getServerSession.mockResolvedValue(null);
    const res = createRes();
    await blogsApi(
      {
        method: "POST",
        body: {
          name: "Caminhos de Fé",
          description: "Reflexões sobre a caminhada cristã no dia a dia.",
          authorBio: "Católico, leitor da Palavra e devoto do Santo Rosário.",
        },
        query: {},
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(Blog.create).not.toHaveBeenCalled();
  });

  test("impede que um usuário crie blog em nome de outra pessoa (403)", async () => {
    const res = createRes();
    await blogsApi(
      {
        method: "POST",
        body: {
          ownerId: otherUserId,
          name: "Caminhos de Fé",
          description: "Reflexões sobre a caminhada cristã no dia a dia.",
          authorBio: "Católico, leitor da Palavra e devoto do Santo Rosário.",
        },
        query: {},
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Blog.create).not.toHaveBeenCalled();
  });

  test("permite criar blog pessoal válido e gera slug automaticamente", async () => {
    Blog.findOne
      .mockReturnValueOnce({ lean: async () => null }) // existingUserBlog
      .mockReturnValueOnce({ lean: async () => null }); // duplicateBlog
    Blog.create.mockImplementation(async (doc) => ({
      _id: blogId,
      ...doc,
      createdAt: new Date("2026-11-06T12:00:00Z"),
      updatedAt: new Date("2026-11-06T12:00:00Z"),
    }));

    const res = createRes();
    await blogsApi(
      {
        method: "POST",
        body: {
          name: "Caminhos de Fé",
          description: "Reflexões sobre a caminhada cristã no dia a dia.",
          authorBio: "Católico, leitor da Palavra e devoto do Santo Rosário.",
        },
        query: {},
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Blog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId,
        name: "Caminhos de Fé",
        normalizedName: "caminhos de fe",
        slug: "caminhos-de-fe",
        status: "active",
      }),
    );
  });

  test("bloqueia criação de segundo blog pelo mesmo usuário (409)", async () => {
    Blog.findOne.mockReturnValueOnce({
      lean: async () => ({ _id: blogId, ownerId }),
    });

    const res = createRes();
    await blogsApi(
      {
        method: "POST",
        body: {
          name: "Segundo Blog",
          description: "Reflexões sobre a caminhada cristã no dia a dia.",
          authorBio: "Católico, leitor da Palavra e devoto do Santo Rosário.",
        },
        query: {},
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Você já possui um blog pessoal cadastrado.",
    });
    expect(Blog.create).not.toHaveBeenCalled();
  });

  test("bloqueia nomes duplicados ignorando maiúsculas/acentos e slugs duplicados (409)", async () => {
    // 1. Nome duplicado ignorando acentos/maiúsculas
    Blog.findOne
      .mockReturnValueOnce({ lean: async () => null })
      .mockReturnValueOnce({
        lean: async () => ({
          _id: blogId,
          normalizedName: "caminhos de fe",
          slug: "outro-slug",
        }),
      });

    const resName = createRes();
    await blogsApi(
      {
        method: "POST",
        body: {
          name: "CAMINHOS DE FE",
          slug: "caminhos-de-fe-novo",
          description: "Reflexões sobre a caminhada cristã no dia a dia.",
          authorBio: "Católico, leitor da Palavra e devoto do Santo Rosário.",
        },
        query: {},
      },
      resName,
    );
    expect(resName.status).toHaveBeenCalledWith(409);
    expect(resName.json).toHaveBeenCalledWith({
      error: "Já existe um blog com este nome na comunidade.",
    });

    // 2. Slug duplicado
    Blog.findOne
      .mockReturnValueOnce({ lean: async () => null })
      .mockReturnValueOnce({
        lean: async () => ({
          _id: blogId,
          normalizedName: "outro nome",
          slug: "caminhos-de-fe",
        }),
      });

    const resSlug = createRes();
    await blogsApi(
      {
        method: "POST",
        body: {
          name: "Luz da Esperança",
          slug: "caminhos-de-fe",
          description: "Reflexões sobre a caminhada cristã no dia a dia.",
          authorBio: "Católico, leitor da Palavra e devoto do Santo Rosário.",
        },
        query: {},
      },
      resSlug,
    );
    expect(resSlug.status).toHaveBeenCalledWith(409);
    expect(resSlug.json).toHaveBeenCalledWith({
      error: "Este endereço (slug) já está em uso por outro blog.",
    });
  });

  test("endpoint de disponibilidade valida nomes reservados e verifica unicidade no banco", async () => {
    Blog.findOne
      .mockReturnValueOnce({ select: () => ({ lean: async () => null }) })
      .mockReturnValueOnce({ select: () => ({ lean: async () => null }) });

    const resOk = createRes();
    await disponibilidadeApi(
      {
        method: "GET",
        query: { name: "Caminhos de Fé", slug: "caminhos-de-fe" },
      },
      resOk,
    );
    expect(resOk.status).toHaveBeenCalledWith(200);
    expect(resOk.json).toHaveBeenCalledWith(
      expect.objectContaining({
        available: true,
        suggestedSlug: "caminhos-de-fe",
      }),
    );

    const resReserved = createRes();
    await disponibilidadeApi(
      {
        method: "GET",
        query: { name: "Admin", slug: "admin" },
      },
      resReserved,
    );
    expect(resReserved.json).toHaveBeenCalledWith(
      expect.objectContaining({
        available: false,
      }),
    );
  });

  test("permite salvar rascunho e publicar artigo apenas no próprio blog", async () => {
    const mockBlogDoc = {
      _id: blogId,
      ownerId,
      status: "active",
      save: jest.fn(),
    };
    Blog.findOne.mockResolvedValue(mockBlogDoc);
    BlogPost.findOne.mockReturnValue({ lean: async () => null });
    BlogPost.create.mockImplementation(async (doc) => ({
      _id: postId,
      ...doc,
    }));

    // 1. Salvar rascunho
    const resDraft = createRes();
    await publicacoesApi(
      {
        method: "POST",
        body: {
          title: "Meditação sobre o Bom Pastor",
          subtitle: "Salmo 23 na vida cotidiana",
          category: "Bíblia e Estudos",
          content:
            "O Senhor é o meu pastor e nada me faltará. Mesmo que eu caminhe pelo vale escuro, tua graça me sustenta.",
          status: "draft",
        },
        query: {},
      },
      resDraft,
    );

    expect(resDraft.status).toHaveBeenCalledWith(201);
    expect(BlogPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        blogId,
        authorId: ownerId,
        slug: "meditacao-sobre-o-bom-pastor",
        status: "draft",
        publishedAt: null,
      }),
    );
  });

  test("impede que outro usuário edite, publique, despublique ou exclua publicação alheia (403)", async () => {
    getServerSession.mockResolvedValue({
      user: { id: otherUserId, name: "Outro Usuário", role: "user" },
    });

    BlogPost.findById.mockResolvedValue({
      _id: postId,
      blogId,
      authorId: ownerId,
      title: "Texto do João",
      slug: "texto-do-joao",
      status: "published",
    });
    Blog.findById.mockResolvedValue({
      _id: blogId,
      ownerId,
      status: "active",
    });

    const resPatch = createRes();
    await publicacaoDetailApi(
      {
        method: "PATCH",
        query: { id: postId },
        body: { action: "unpublish" },
      },
      resPatch,
    );
    expect(resPatch.status).toHaveBeenCalledWith(403);

    const resDelete = createRes();
    await publicacaoDetailApi(
      {
        method: "DELETE",
        query: { id: postId },
        body: {},
      },
      resDelete,
    );
    expect(resDelete.status).toHaveBeenCalledWith(403);
    expect(BlogPost.deleteOne).not.toHaveBeenCalled();
  });

  test("permite ao proprietário editar, publicar, despublicar e excluir sua própria publicação", async () => {
    const savePost = jest.fn();
    const saveBlog = jest.fn();
    const postDoc = {
      _id: postId,
      blogId,
      authorId: ownerId,
      title: "Meditação Inicial",
      subtitle: "",
      slug: "meditacao-inicial",
      category: "Reflexões",
      content:
        "Texto inicial suficiente para validação completa do artigo no blog.",
      status: "draft",
      createdAt: new Date("2026-11-06T10:00:00Z"),
      updatedAt: new Date("2026-11-06T10:00:00Z"),
      publishedAt: null,
      save: savePost,
    };
    const blogDoc = {
      _id: blogId,
      ownerId,
      status: "active",
      save: saveBlog,
    };

    BlogPost.findById.mockResolvedValue(postDoc);
    Blog.findById.mockResolvedValue(blogDoc);
    BlogPost.findOne.mockReturnValue({ lean: async () => null });

    // Publicar rascunho
    const resPublish = createRes();
    await publicacaoDetailApi(
      {
        method: "PATCH",
        query: { id: postId },
        body: { action: "publish" },
      },
      resPublish,
    );
    expect(resPublish.status).toHaveBeenCalledWith(200);
    expect(postDoc.status).toBe("published");
    expect(postDoc.publishedAt).toBeInstanceOf(Date);

    // Despublicar
    const resUnpublish = createRes();
    await publicacaoDetailApi(
      {
        method: "PATCH",
        query: { id: postId },
        body: { action: "unpublish" },
      },
      resUnpublish,
    );
    expect(resUnpublish.status).toHaveBeenCalledWith(200);
    expect(postDoc.status).toBe("draft");
    expect(postDoc.publishedAt).toBeNull();

    // Excluir
    const resDelete = createRes();
    await publicacaoDetailApi(
      {
        method: "DELETE",
        query: { id: postId },
        body: {},
      },
      resDelete,
    );
    expect(resDelete.status).toHaveBeenCalledWith(200);
    expect(BlogPost.deleteOne).toHaveBeenCalledWith({
      _id: postId,
      blogId,
      authorId: ownerId,
    });
  });

  test("bloqueia acesso público a rascunhos ou artigos despublicados mesmo conhecendo a URL (404)", async () => {
    Blog.findOne.mockReturnValue({
      lean: async () => ({
        _id: blogId,
        ownerId,
        name: "Caminhos de Fé",
        slug: "caminhos-de-fe",
        status: "active",
      }),
    });
    BlogPost.findOne.mockReturnValue({
      lean: async () => ({
        _id: postId,
        blogId,
        authorId: ownerId,
        title: "Rascunho Secreto",
        slug: "rascunho-secreto",
        status: "draft",
      }),
    });

    const res = createRes();
    await publicPostApi(
      {
        method: "GET",
        query: { slug: "caminhos-de-fe", post: "rascunho-secreto" },
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Interface e Navegação — Menu Blog, Diretório, Blog Público, Artigo e Painel /meu-blog", () => {
  test("exibe o item Blog no menu principal na ordem: Início | Oratório | Blog | Capelinha | Comunidades", () => {
    const html = renderToStaticMarkup(
      React.createElement(BlogsDirectory, {
        initialItems: [],
        initialLoaded: true,
      }),
    );

    expect(html).toContain('href="/blogs" aria-current="page"');
    const navMatch = html.match(/<nav class="p-nav"[^>]*>([\s\S]*?)<\/nav>/);
    expect(navMatch).not.toBeNull();
    const navHtml = navMatch[1];
    expect(navHtml.indexOf("Início")).toBeLessThan(navHtml.indexOf("Oratório"));
    expect(navHtml.indexOf("Oratório")).toBeLessThan(navHtml.indexOf("Blog"));
    expect(navHtml.indexOf("Blog")).toBeLessThan(navHtml.indexOf("Capelinha"));
    expect(navHtml.indexOf("Capelinha")).toBeLessThan(
      navHtml.indexOf("Comunidades"),
    );

    // Estado vazio acolhedor
    expect(html).toContain("Vozes da Comunidade");
    expect(html).toContain(
      "Histórias, reflexões e testemunhos compartilhados na caminhada com Cristo.",
    );
    expect(html).toContain(
      "Este espaço está começando a florescer. Em breve, novas reflexões e estudos estarão disponíveis para leitura.",
    );
    expect(html).toContain("Criar meu blog");
    expect(html).toContain(BLOG_INSTITUTIONAL_DISCLAIMER);
  });

  test("renderiza diretório público (/blogs) com blogs listados, contadores e paginação", () => {
    const html = renderToStaticMarkup(
      React.createElement(BlogsDirectory, {
        initialLoaded: true,
        initialPage: 1,
        initialTotalPages: 2,
        initialItems: [
          {
            _id: blogId,
            name: "Caminhos de Fé",
            slug: "caminhos-de-fe",
            description: "Estudos bíblicos e testemunhos da vida cristã.",
            authorName: "João Batista",
            publishedCount: 3,
            lastPublishedAt: "2026-11-06T12:00:00.000Z",
          },
        ],
      }),
    );

    expect(html).toContain("Caminhos de Fé");
    expect(html).toContain("Estudos bíblicos e testemunhos da vida cristã.");
    expect(html).toContain("POR João Batista");
    expect(html).toContain("3 publicações");
    expect(html).toContain('href="/blogs/caminhos-de-fe"');
    expect(html).toContain("Página 1 de 2");
  });

  test("renderiza página pública do blog (/blogs/[slug]) e página do artigo (/blogs/[slug]/[post]) com metadados SEO e opção de denúncia", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/blogs/[slug]",
      asPath: "/blogs/caminhos-de-fe",
      query: { slug: "caminhos-de-fe" },
    });

    const blogHtml = renderToStaticMarkup(
      React.createElement(PublicBlogPage, {
        initialLoaded: true,
        initialBlog: {
          _id: blogId,
          name: "Caminhos de Fé",
          slug: "caminhos-de-fe",
          description: "Estudos bíblicos e testemunhos da vida cristã.",
          authorName: "João Batista",
          authorBio: "Leitor assíduo das Escrituras.",
        },
        initialPosts: [
          {
            _id: postId,
            title: "A Paz que vem da Oração",
            subtitle: "Como perseverar no silêncio interior",
            slug: "a-paz-que-vem-da-oracao",
            category: "Espiritualidade",
            excerpt: "A oração diária transforma o coração.",
            publishedAt: "2026-11-06T12:00:00.000Z",
          },
        ],
      }),
    );

    expect(blogHtml).toContain(
      "<title>Caminhos de Fé — Vozes da Comunidade | Caminhar para Cristo</title>",
    );
    expect(blogHtml).toContain("Leitor assíduo das Escrituras.");
    expect(blogHtml).toContain("A Paz que vem da Oração");
    expect(blogHtml).toContain(
      'href="/blogs/caminhos-de-fe/a-paz-que-vem-da-oracao"',
    );

    mockUseRouter.mockReturnValue({
      pathname: "/blogs/[slug]/[post]",
      asPath: "/blogs/caminhos-de-fe/a-paz-que-vem-da-oracao",
      query: { slug: "caminhos-de-fe", post: "a-paz-que-vem-da-oracao" },
    });

    const postHtml = renderToStaticMarkup(
      React.createElement(PublicBlogPostPage, {
        initialLoaded: true,
        initialBlog: {
          _id: blogId,
          name: "Caminhos de Fé",
          slug: "caminhos-de-fe",
          description: "Estudos bíblicos e testemunhos da vida cristã.",
          authorName: "João Batista",
          authorBio: "Leitor assíduo das Escrituras.",
        },
        initialPost: {
          _id: postId,
          title: "A Paz que vem da Oração",
          subtitle: "Como perseverar no silêncio interior",
          slug: "a-paz-que-vem-da-oracao",
          category: "Espiritualidade",
          content:
            "A **oração diária** transforma o coração.\n\n- Silêncio\n- Confiança em Deus",
          publishedAt: "2026-11-06T12:00:00.000Z",
        },
      }),
    );

    expect(postHtml).toContain(
      "<title>A Paz que vem da Oração — Caminhos de Fé | Caminhar para Cristo</title>",
    );
    expect(postHtml).toContain("<strong>oração diária</strong>");
    expect(postHtml).toContain("<li><span>Silêncio</span></li>");
    expect(postHtml).toContain("Sinalizar à moderação");
    expect(postHtml).toContain("Voltar para Caminhos de Fé");
    expect(postHtml).toContain(BLOG_INSTITUTIONAL_DISCLAIMER);
  });

  test("renderiza painel do proprietário (/meu-blog) com editor, categorias e gerenciamento de artigos", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/meu-blog",
      asPath: "/meu-blog",
      query: {},
    });

    const ownerHtml = renderToStaticMarkup(
      React.createElement(MeuBlogPage, {
        initialLoaded: true,
        initialBlog: {
          _id: blogId,
          ownerId,
          name: "Caminhos de Fé",
          slug: "caminhos-de-fe",
          description: "Estudos bíblicos e testemunhos da vida cristã.",
          authorBio: "Leitor assíduo das Escrituras.",
        },
        initialPosts: [
          {
            _id: postId,
            title: "Rascunho de Estudo",
            subtitle: "Em preparação",
            slug: "rascunho-de-estudo",
            category: "Bíblia e Estudos",
            content: "Conteúdo do rascunho em preparação.",
            status: "draft",
            updatedAt: "2026-11-06T12:00:00.000Z",
          },
        ],
      }),
    );

    expect(ownerHtml).toContain("/blogs/caminhos-de-fe");
    expect(ownerHtml).toContain("Escrever novo artigo");
    expect(ownerHtml).toContain("Salvar rascunho");
    expect(ownerHtml).toContain("Publicar artigo");
    expect(ownerHtml).toContain("Pré-visualizar publicação");
    expect(ownerHtml).toContain("Rascunho de Estudo");
    for (const category of BLOG_CATEGORIES) {
      expect(ownerHtml).toContain(category);
    }
  });

  test("identity.css possui regras responsivas para o diretório de blogs e painel do proprietário", () => {
    const identityCss = fs.readFileSync(
      path.join(process.cwd(), "styles", "identity.css"),
      "utf8",
    );

    expect(identityCss).toContain(".prayer-app .pl-blogs-grid");
    expect(identityCss).toContain(".prayer-app .pl-owner-workspace");
    expect(identityCss).toContain(".prayer-app .pl-blog-article-card");
  });
});

describe("Autorização Editorial Restrita — 3 Contas Autorizadas, Superadmin e Leitura Pública", () => {
  test("lista exatamente as três contas autorizadas para funções editoriais", () => {
    expect(AUTHORIZED_BLOG_AUTHOR_EMAILS).toEqual([
      "ricardosumo1000@gmail.com",
      "ricardo.q4p@gmail.com",
      "colorindoporai@gmail.com",
    ]);
    expect(
      canPublishInBlog({ user: { email: "ricardosumo1000@gmail.com" } }),
    ).toBe(true);
    expect(canPublishInBlog({ user: { email: "RICARDO.Q4P@GMAIL.COM" } })).toBe(
      true,
    );
    expect(
      canPublishInBlog({ user: { email: "colorindoporai@gmail.com" } }),
    ).toBe(true);
    expect(
      canPublishInBlog({ user: { email: "comum@gmail.com", role: "user" } }),
    ).toBe(false);
    expect(
      canPublishInBlog({
        user: { email: "admin@panteralab.com.br", role: "superadmin" },
      }),
    ).toBe(true);
  });

  test("Ricardo consegue publicar e editar seus próprios artigos pelas duas contas autorizadas", async () => {
    for (const [accountId, email, blogSlug] of [
      [ownerId, "ricardosumo1000@gmail.com", "reflexoes-ricardo-1"],
      [ricardoSecondId, "ricardo.q4p@gmail.com", "reflexoes-ricardo-2"],
    ]) {
      getServerSession.mockResolvedValue({
        user: { id: accountId, name: "Ricardo", email, role: "user" },
      });

      const authorBlog = {
        _id: blogId,
        ownerId: accountId,
        slug: blogSlug,
        status: "active",
        save: jest.fn(),
      };
      Blog.findOne.mockResolvedValue(authorBlog);
      BlogPost.findOne.mockReturnValue({ lean: async () => null });
      BlogPost.create.mockImplementation(async (doc) => ({
        _id: postId,
        ...doc,
      }));

      const resCreate = createRes();
      await publicacoesApi(
        {
          method: "POST",
          body: {
            title: `Artigo publicado por ${email}`,
            subtitle: "Caminhada de oração",
            category: "Reflexões",
            content:
              "Conteúdo completo e edificante publicado por uma das contas autorizadas de Ricardo.",
            status: "published",
          },
          query: {},
        },
        resCreate,
      );
      expect(resCreate.status).toHaveBeenCalledWith(201);

      const postDoc = {
        _id: postId,
        blogId,
        authorId: accountId,
        title: "Título original",
        subtitle: "",
        slug: "titulo-original",
        category: "Reflexões",
        content: "Conteúdo original válido para edição pelo próprio autor.",
        status: "published",
        publishedAt: new Date(),
        save: jest.fn(),
      };
      BlogPost.findById.mockResolvedValue(postDoc);
      Blog.findById.mockResolvedValue(authorBlog);

      const resEdit = createRes();
      await publicacaoDetailApi(
        {
          method: "PATCH",
          query: { id: postId },
          body: {
            title: "Título editado pelo autor",
            category: "Reflexões",
            content:
              "Conteúdo atualizado com sucesso pela própria conta autorizada de Ricardo.",
            status: "published",
          },
        },
        resEdit,
      );
      expect(resEdit.status).toHaveBeenCalledWith(200);
      expect(postDoc.title).toBe("Título editado pelo autor");
    }
  });

  test("Fernanda consegue publicar e editar seus artigos usando a conta existente colorindoporai@gmail.com sem criar segunda conta ou alterar seus dados", async () => {
    const existingFernandaUser = {
      _id: fernandaId,
      name: "Fernanda",
      email: "colorindoporai@gmail.com",
      role: "user",
    };

    // Sessão autenticada identifica Fernanda pelo e-mail e associa à conta existente no banco
    getServerSession.mockResolvedValue({
      user: {
        id: fernandaId,
        name: "Fernanda",
        email: "colorindoporai@gmail.com",
        role: "user",
      },
    });
    User.findOne.mockReturnValue({
      select: () => ({
        lean: async () => existingFernandaUser,
      }),
    });

    const fernandaBlog = {
      _id: "65a333333333333333333339",
      ownerId: fernandaId,
      name: "Colorindo por Aí na Fé",
      slug: "colorindo-por-ai-na-fe",
      status: "active",
      save: jest.fn(),
    };
    Blog.findOne.mockResolvedValue(fernandaBlog);
    BlogPost.findOne.mockReturnValue({ lean: async () => null });
    BlogPost.create.mockImplementation(async (doc) => ({
      _id: "65a444444444444444444449",
      ...doc,
    }));

    const resPublish = createRes();
    await publicacoesApi(
      {
        method: "POST",
        body: {
          title: "Arte, Oração e Contemplação",
          subtitle: "A beleza da criação divina",
          category: "Espiritualidade",
          content:
            "A contemplação da criação nos aproxima do Criador em cada pequeno detalhe do cotidiano.",
          status: "published",
        },
        query: {},
      },
      resPublish,
    );

    expect(resPublish.status).toHaveBeenCalledWith(201);
    expect(BlogPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        blogId: fernandaBlog._id,
        authorId: fernandaId,
        status: "published",
      }),
    );

    // Fernanda edita seu próprio artigo
    const fernandaPost = {
      _id: "65a444444444444444444449",
      blogId: fernandaBlog._id,
      authorId: fernandaId,
      title: "Arte, Oração e Contemplação",
      subtitle: "",
      slug: "arte-oracao-e-contemplacao",
      category: "Espiritualidade",
      content:
        "A contemplação da criação nos aproxima do Criador em cada pequeno detalhe do cotidiano.",
      status: "published",
      publishedAt: new Date(),
      save: jest.fn(),
    };
    BlogPost.findById.mockResolvedValue(fernandaPost);
    Blog.findById.mockResolvedValue(fernandaBlog);

    const resEdit = createRes();
    await publicacaoDetailApi(
      {
        method: "PATCH",
        query: { id: fernandaPost._id },
        body: {
          title: "Arte, Oração e Contemplação Cristã",
          category: "Espiritualidade",
          content:
            "Texto atualizado pela autora Fernanda mantendo a integridade da sua conta existente.",
          status: "published",
        },
      },
      resEdit,
    );
    expect(resEdit.status).toHaveBeenCalledWith(200);
    expect(fernandaPost.title).toBe("Arte, Oração e Contemplação Cristã");
  });

  test("um autor autorizado não consegue editar ou excluir artigos de outro autor autorizado (403)", async () => {
    // Fernanda autenticada tentando editar/excluir artigo de Ricardo
    getServerSession.mockResolvedValue({
      user: {
        id: fernandaId,
        name: "Fernanda",
        email: "colorindoporai@gmail.com",
        role: "user",
      },
    });
    User.findOne.mockReturnValue({
      select: () => ({
        lean: async () => ({
          _id: fernandaId,
          name: "Fernanda",
          email: "colorindoporai@gmail.com",
          role: "user",
        }),
      }),
    });

    BlogPost.findById.mockResolvedValue({
      _id: postId,
      blogId,
      authorId: ownerId,
      title: "Artigo do Ricardo",
      slug: "artigo-do-ricardo",
      status: "published",
    });
    Blog.findById.mockResolvedValue({
      _id: blogId,
      ownerId,
      status: "active",
    });

    const resPatch = createRes();
    await publicacaoDetailApi(
      {
        method: "PATCH",
        query: { id: postId },
        body: {
          title: "Tentativa de edição cruzada",
          category: "Reflexões",
          content:
            "Tentativa de alterar artigo pertencente a outro autor autorizado.",
        },
      },
      resPatch,
    );
    expect(resPatch.status).toHaveBeenCalledWith(403);

    const resDelete = createRes();
    await publicacaoDetailApi(
      {
        method: "DELETE",
        query: { id: postId },
        body: {},
      },
      resDelete,
    );
    expect(resDelete.status).toHaveBeenCalledWith(403);
    expect(BlogPost.deleteOne).not.toHaveBeenCalled();
  });

  test("o administrador principal (superadmin) consegue gerenciar, editar, publicar, despublicar e excluir artigos de qualquer autor", async () => {
    getServerSession.mockResolvedValue({
      user: {
        id: superAdminId,
        name: "Administrador Principal",
        email: "admin@panteralab.com.br",
        role: "superadmin",
      },
    });

    const fernandaBlog = {
      _id: blogId,
      ownerId: fernandaId,
      status: "active",
      save: jest.fn(),
    };
    const fernandaPost = {
      _id: postId,
      blogId,
      authorId: fernandaId,
      title: "Artigo da Fernanda",
      subtitle: "",
      slug: "artigo-da-fernanda",
      category: "Testemunhos",
      content:
        "Texto original publicado pela Fernanda que será gerenciado pelo administrador principal.",
      status: "published",
      publishedAt: new Date(),
      save: jest.fn(),
    };

    BlogPost.findById.mockResolvedValue(fernandaPost);
    Blog.findById.mockResolvedValue(fernandaBlog);
    BlogPost.findOne.mockReturnValue({ lean: async () => null });

    // 1. Editar artigo de outro autor
    const resEdit = createRes();
    await publicacaoDetailApi(
      {
        method: "PATCH",
        query: { id: postId },
        body: {
          title: "Artigo da Fernanda (Revisado)",
          category: "Testemunhos",
          content:
            "Texto original publicado pela Fernanda e revisado pelo administrador principal.",
          status: "published",
        },
      },
      resEdit,
    );
    expect(resEdit.status).toHaveBeenCalledWith(200);
    expect(fernandaPost.title).toBe("Artigo da Fernanda (Revisado)");

    // 2. Despublicar artigo de outro autor
    const resUnpublish = createRes();
    await publicacaoDetailApi(
      {
        method: "PATCH",
        query: { id: postId },
        body: { action: "unpublish" },
      },
      resUnpublish,
    );
    expect(resUnpublish.status).toHaveBeenCalledWith(200);
    expect(fernandaPost.status).toBe("draft");

    // 3. Excluir artigo de outro autor
    const resDelete = createRes();
    await publicacaoDetailApi(
      {
        method: "DELETE",
        query: { id: postId },
        body: {},
      },
      resDelete,
    );
    expect(resDelete.status).toHaveBeenCalledWith(200);
    expect(BlogPost.deleteOne).toHaveBeenCalledWith({
      _id: postId,
      blogId,
    });
  });

  test("usuários comuns não conseguem publicar, editar ou excluir nas APIs mesmo enviando e-mail ou permissão falsos no body (403)", async () => {
    getServerSession.mockResolvedValue({
      user: {
        id: otherUserId,
        name: "Leitor Comum",
        email: "leitor.comum@gmail.com",
        role: "user",
      },
    });
    User.findOne.mockReturnValue({
      select: () => ({
        lean: async () => ({
          _id: otherUserId,
          name: "Leitor Comum",
          email: "leitor.comum@gmail.com",
          role: "user",
        }),
      }),
    });

    // 1. POST /api/blogs bloqueado
    const resCreateBlog = createRes();
    await blogsApi(
      {
        method: "POST",
        body: {
          email: "ricardosumo1000@gmail.com",
          role: "superadmin",
          name: "Tentativa Não Autorizada",
          description: "Descrição longa o suficiente para passar validação.",
          authorBio: "Biografia longa o suficiente para passar validação.",
        },
        query: {},
      },
      resCreateBlog,
    );
    expect(resCreateBlog.status).toHaveBeenCalledWith(403);
    expect(Blog.create).not.toHaveBeenCalled();

    // 2. GET e PATCH /api/blogs/meu bloqueados
    const resGetMeu = createRes();
    await meuBlogApi({ method: "GET", query: {} }, resGetMeu);
    expect(resGetMeu.status).toHaveBeenCalledWith(403);

    const resPatchMeu = createRes();
    await meuBlogApi(
      { method: "PATCH", body: { name: "Novo Nome" }, query: {} },
      resPatchMeu,
    );
    expect(resPatchMeu.status).toHaveBeenCalledWith(403);

    // 3. GET /api/blogs/disponibilidade bloqueado
    const resDisp = createRes();
    await disponibilidadeApi(
      { method: "GET", query: { name: "Teste" } },
      resDisp,
    );
    expect(resDisp.status).toHaveBeenCalledWith(403);

    // 4. POST /api/blogs/publicacoes bloqueado
    const resCreatePost = createRes();
    await publicacoesApi(
      {
        method: "POST",
        body: {
          email: "colorindoporai@gmail.com",
          role: "superadmin",
          title: "Artigo Não Autorizado",
          category: "Reflexões",
          content:
            "Conteúdo que um usuário comum jamais deve conseguir publicar.",
          status: "published",
        },
        query: {},
      },
      resCreatePost,
    );
    expect(resCreatePost.status).toHaveBeenCalledWith(403);
    expect(BlogPost.create).not.toHaveBeenCalled();

    // 5. PATCH e DELETE /api/blogs/publicacoes/[id] bloqueados
    const resPatchPost = createRes();
    await publicacaoDetailApi(
      {
        method: "PATCH",
        query: { id: postId },
        body: { action: "publish" },
      },
      resPatchPost,
    );
    expect(resPatchPost.status).toHaveBeenCalledWith(403);

    const resDeletePost = createRes();
    await publicacaoDetailApi(
      {
        method: "DELETE",
        query: { id: postId },
        body: {},
      },
      resDeletePost,
    );
    expect(resDeletePost.status).toHaveBeenCalledWith(403);
  });

  test("leitura pública, URLs existentes e ocultação de controles editoriais para leitores comuns funcionam corretamente", async () => {
    // Visitante / leitor comum vê apenas experiência de leitura, sem botão de criar blog
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: otherUserId,
          name: "Leitor Comum",
          email: "leitor@gmail.com",
          role: "user",
        },
      },
      status: "authenticated",
    });

    const readerDirectoryHtml = renderToStaticMarkup(
      React.createElement(BlogAliasPage, {
        initialLoaded: true,
        initialItems: [
          {
            _id: blogId,
            name: "Coluna da Fernanda",
            slug: "coluna-da-fernanda",
            description: "Reflexões e espiritualidade no dia a dia.",
            authorName: "Fernanda",
            publishedCount: 2,
            lastPublishedAt: "2026-11-08T12:00:00.000Z",
          },
        ],
      }),
    );

    expect(readerDirectoryHtml).toContain("Coluna da Fernanda");
    expect(readerDirectoryHtml).toContain('href="/blogs/coluna-da-fernanda"');
    expect(readerDirectoryHtml).not.toContain("Criar meu blog");
    expect(readerDirectoryHtml).not.toContain("Gerenciar meu blog");

    // Leitor comum acessando /meu-blog vê aviso de área editorial restrita sem formulário
    const restrictedWorkspaceHtml = renderToStaticMarkup(
      React.createElement(MeuBlogPage, { initialLoaded: true }),
    );
    expect(restrictedWorkspaceHtml).toContain(
      "Área editorial restrita aos autores do Blog",
    );
    expect(restrictedWorkspaceHtml).not.toContain("Escrever novo artigo");

    // Leitura pública pela API GET /api/blogs/[slug]/[post] continua aberta para qualquer visitante
    getServerSession.mockResolvedValue(null);
    Blog.findOne.mockReturnValue({
      lean: async () => ({
        _id: blogId,
        ownerId: fernandaId,
        name: "Coluna da Fernanda",
        slug: "coluna-da-fernanda",
        description: "Reflexões e espiritualidade.",
        authorBio: "Autora do Blog.",
        status: "active",
      }),
    });
    BlogPost.findOne.mockReturnValue({
      lean: async () => ({
        _id: postId,
        blogId,
        authorId: fernandaId,
        title: "Caminhar na Luz",
        subtitle: "Esperança cristã",
        slug: "caminhar-na-luz",
        category: "Espiritualidade",
        content: "Artigo público acessível na URL existente.",
        status: "published",
        publishedAt: new Date("2026-11-08T12:00:00Z"),
        updatedAt: new Date("2026-11-08T12:00:00Z"),
      }),
    });
    User.findById.mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: fernandaId, name: "Fernanda" }),
      }),
    });

    const publicRes = createRes();
    await publicPostApi(
      {
        method: "GET",
        query: { slug: "coluna-da-fernanda", post: "caminhar-na-luz" },
      },
      publicRes,
    );
    expect(publicRes.status).toHaveBeenCalledWith(200);
    expect(publicRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        blog: expect.objectContaining({
          slug: "coluna-da-fernanda",
          authorName: "Fernanda",
          isOwner: false,
        }),
        post: expect.objectContaining({
          slug: "caminhar-na-luz",
          title: "Caminhar na Luz",
        }),
      }),
    );
  });
});

describe("Evolução Visual e Editorial — Capas, Magic Bytes, Sumário H2/H3, Progresso e Revista Digital", () => {
  test("valida o conteúdo real do arquivo (magic bytes) para JPG, PNG e WebP e rejeita arquivos falsificados", () => {
    const jpegHeader = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const fakeScriptAsJpg = new Uint8Array([
      0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3e, 0x61, 0x6c, 0x65, 0x72,
    ]);

    expect(detectImageFormatFromBytes(jpegHeader)).toBe("image/jpeg");
    expect(detectImageFormatFromBytes(pngHeader)).toBe("image/png");
    expect(detectImageFormatFromBytes(webpHeader)).toBe("image/webp");
    expect(detectImageFormatFromBytes(fakeScriptAsJpg)).toBeNull();

    expect(hasValidImageMagicBytes(jpegHeader, "image/jpeg")).toBe(true);
    expect(hasValidImageMagicBytes(pngHeader, "image/png")).toBe(true);
    expect(hasValidImageMagicBytes(webpHeader, "image/webp")).toBe(true);
    expect(hasValidImageMagicBytes(jpegHeader, "image/png")).toBe(false);
    expect(hasValidImageMagicBytes(fakeScriptAsJpg, "image/jpeg")).toBe(false);
  });

  test("valida dimensões e proporção horizontal recomendada (1600x600) e rejeita imagens verticais ou pequenas", () => {
    expect(validateBlogCoverDimensions(1600, 600).ok).toBe(true);
    expect(validateBlogCoverDimensions(1200, 500).ok).toBe(true);
    expect(validateBlogCoverDimensions(400, 200).ok).toBe(false);
    expect(validateBlogCoverDimensions(600, 900).ok).toBe(false);
  });

  test("valida URL de capa do blog e do artigo no servidor (Cloudinary ou capa padrão) e rejeita URLs externas", () => {
    expect(validateBlogCoverUrl("").ok).toBe(true);
    expect(validateBlogCoverUrl(DEFAULT_BLOG_COVER_IMAGE).ok).toBe(true);
    expect(
      validateBlogCoverUrl(
        "https://res.cloudinary.com/panteralab/image/upload/v1/capa-blog.webp",
      ).ok,
    ).toBe(true);
    expect(validateBlogCoverUrl("https://evil.example.com/capa.jpg").ok).toBe(
      false,
    );

    const invalidBlog = validateBlogInput({
      name: "Revista de Oração",
      description: "Descrição editorial válida da revista.",
      authorBio: "Apresentação válida do autor no blog.",
      coverImage: "https://attacker.com/fake.png",
    });
    expect(invalidBlog.ok).toBe(false);
  });

  test("extrai títulos H2 e H3 para sumário automático, normaliza tags e calcula tempo de leitura", () => {
    const content = [
      "Introdução contemplativa ao tema.",
      "## O silêncio interior",
      "Texto sobre a importância do recolhimento.",
      "### Prática cotidiana",
      "Passos práticos para a oração diária.",
    ].join("\n\n");

    const headings = extractBlogHeadings(content);
    expect(headings).toEqual([
      { id: "o-silencio-interior", level: 2, text: "O silêncio interior" },
      { id: "pratica-cotidiana", level: 3, text: "Prática cotidiana" },
    ]);
    expect(shouldShowBlogTableOfContents(headings)).toBe(true);
    expect(estimateReadingTimeMinutes(content)).toBeGreaterThanOrEqual(1);
    expect(normalizeBlogTags("Oração, Silêncio, oração, #Liturgia, a")).toEqual(
      ["Oração", "Silêncio", "Liturgia"],
    );
  });

  test("renderiza seção Identidade visual na criação/edição do blog, revista digital pública e artigo com barra de progresso e sumário", () => {
    expect(typeof BlogCoverUploader).toBe("function");

    const setupHtml = renderToStaticMarkup(
      React.createElement(MeuBlogPage, {
        initialLoaded: true,
        initialBlog: null,
        initialPosts: [],
      }),
    );
    expect(setupHtml).toContain("Identidade visual");
    expect(setupHtml).toContain("Imagem de capa do blog");
    expect(setupHtml).toContain("1600 × 600 pixels");
    expect(setupHtml).toContain("Pré-visualizar blog");

    mockUseRouter.mockReturnValue({
      pathname: "/blogs/[slug]",
      asPath: "/blogs/revista-da-fe",
      query: { slug: "revista-da-fe" },
    });

    const magazineHtml = renderToStaticMarkup(
      React.createElement(PublicBlogPage, {
        initialLoaded: true,
        initialBlog: {
          _id: blogId,
          name: "Revista da Fé",
          slug: "revista-da-fe",
          description: "Ensaios e meditações para a caminhada cristã.",
          authorName: "Fernanda",
          authorBio: "Autora dedicada à espiritualidade e arte cristã.",
          authorAvatar:
            "https://res.cloudinary.com/panteralab/image/upload/v1/avatar-fernanda.webp",
          coverImage:
            "https://res.cloudinary.com/panteralab/image/upload/v1/capa-revista.webp",
        },
        initialPosts: [
          {
            _id: postId,
            title: "Beleza e Liturgia",
            subtitle: "A arte a serviço do sagrado",
            slug: "beleza-e-liturgia",
            category: "Espiritualidade",
            excerpt: "Uma reflexão sobre a contemplação da beleza.",
            tags: ["Liturgia", "Arte"],
            featured: true,
            readingTimeMinutes: 4,
            publishedAt: "2026-11-09T12:00:00.000Z",
          },
        ],
      }),
    );

    expect(magazineHtml).toContain("ARTIGO EM DESTAQUE");
    expect(magazineHtml).toContain("4 min de leitura");
    expect(magazineHtml).toContain("Compartilhar blog");
    expect(magazineHtml).toContain("Buscar artigos");
    expect(magazineHtml).toContain("#Liturgia");
    expect(magazineHtml).toContain("Propósito de Revista da Fé:");

    mockUseRouter.mockReturnValue({
      pathname: "/blogs/[slug]/[post]",
      asPath: "/blogs/revista-da-fe/beleza-e-liturgia",
      query: { slug: "revista-da-fe", post: "beleza-e-liturgia" },
    });

    const articleHtml = renderToStaticMarkup(
      React.createElement(PublicBlogPostPage, {
        initialLoaded: true,
        initialBlog: {
          _id: blogId,
          name: "Revista da Fé",
          slug: "revista-da-fe",
          description: "Ensaios e meditações.",
          authorName: "Fernanda",
          authorBio: "Autora dedicada à espiritualidade.",
          authorAvatar: DEFAULT_AUTHOR_AVATAR,
          coverImage: DEFAULT_BLOG_COVER_IMAGE,
        },
        initialPost: {
          _id: postId,
          title: "Beleza e Liturgia",
          subtitle: "A arte a serviço do sagrado",
          slug: "beleza-e-liturgia",
          category: "Espiritualidade",
          tags: ["Liturgia"],
          readingTimeMinutes: 3,
          content:
            "Introdução ao estudo.\n\n## O Sagrado na Arte\n\nPrimeiro ponto.\n\n### Arquitetura e Luz\n\nSegundo ponto.",
          publishedAt: "2026-11-09T12:00:00.000Z",
        },
        initialRelatedPosts: [
          {
            _id: "65a444444444444444444499",
            title: "O Canto Gregoriano",
            slug: "o-canto-gregoriano",
            category: "Orações",
            excerpt: "A tradição musical da Igreja.",
            readingTimeMinutes: 2,
          },
        ],
      }),
    );

    expect(articleHtml).toContain('aria-label="Progresso de leitura"');
    expect(articleHtml).toContain('aria-label="Sumário do artigo"');
    expect(articleHtml).toContain('href="#o-sagrado-na-arte"');
    expect(articleHtml).toContain('href="#arquitetura-e-luz"');
    expect(articleHtml).toContain("3 min de leitura");
    expect(articleHtml).toContain("Artigos relacionados");
    expect(articleHtml).toContain("O Canto Gregoriano");
  });
});
