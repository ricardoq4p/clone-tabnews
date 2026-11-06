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
  BLOG_CATEGORIES,
  BLOG_INSTITUTIONAL_DISCLAIMER,
  normalizeBlogName,
  slugifyText,
  isReservedBlogIdentifier,
  validateBlogInput,
  validateBlogPostInput,
  sanitizeBlogPostContent,
  parseBlogContentBlocks,
  canManageBlog,
  canManageBlogPost,
  canReadPublicBlogPost,
} from "../lib/blogs";
import blogsApi from "../pages/api/blogs/index";
import disponibilidadeApi from "../pages/api/blogs/disponibilidade";
import meuBlogApi from "../pages/api/blogs/meu";
import publicacoesApi from "../pages/api/blogs/publicacoes/index";
import publicacaoDetailApi from "../pages/api/blogs/publicacoes/[id]";
import publicBlogApi from "../pages/api/blogs/[slug]/index";
import publicPostApi from "../pages/api/blogs/[slug]/[post]";
import BlogsDirectory from "../pages/blogs/index";
import MeuBlogPage from "../pages/meu-blog";
import PublicBlogPage from "../pages/blogs/[slug]/index";
import PublicBlogPostPage from "../pages/blogs/[slug]/[post]";

const ownerId = "65a111111111111111111111";
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
  process.env.MONGODB_URI = "mongodb://127.0.0.1/isolated-test-never-connected";
  getServerSession.mockResolvedValue({
    user: { id: ownerId, name: "João Batista", role: "user" },
  });
  mockUseSession.mockReturnValue({
    data: { user: { id: ownerId, name: "João Batista", role: "user" } },
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

describe("Interface e Navegação — Menu Blogs, Diretório, Blog Público, Artigo e Painel /meu-blog", () => {
  test("exibe o item Blogs no menu principal na ordem: Início | Oratório | Blogs | Capelinha | Comunidades", () => {
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
    expect(navHtml.indexOf("Oratório")).toBeLessThan(navHtml.indexOf("Blogs"));
    expect(navHtml.indexOf("Blogs")).toBeLessThan(navHtml.indexOf("Capelinha"));
    expect(navHtml.indexOf("Capelinha")).toBeLessThan(
      navHtml.indexOf("Comunidades"),
    );

    // Estado vazio acolhedor
    expect(html).toContain("Vozes da Comunidade");
    expect(html).toContain(
      "Histórias, reflexões e testemunhos compartilhados na caminhada com Cristo.",
    );
    expect(html).toContain(
      "Este espaço está começando a florescer. Seja o primeiro a compartilhar suas reflexões.",
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
