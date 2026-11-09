import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: "507f1f77bcf86cd799439099",
        name: "Admin",
        role: "superadmin",
      },
    },
    status: "authenticated",
  })),
}));
jest.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/administracao",
    asPath: "/administracao",
    query: {},
    isReady: true,
    push: jest.fn(),
  }),
}));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
jest.mock("../lib/pusher", () => ({ notifyChange: jest.fn() }));

jest.mock("../lib/models/Blog", () => ({
  __esModule: true,
  default: {
    init: jest.fn(async () => {}),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock("../lib/models/BlogPost", () => ({
  __esModule: true,
  default: {
    init: jest.fn(async () => {}),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock("../lib/models/AbuseReport", () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock("../lib/models/ModerationLog", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(),
  },
}));

import { getServerSession } from "next-auth";
import Blog from "../lib/models/Blog";
import BlogPost from "../lib/models/BlogPost";
import User from "../lib/models/User";
import AbuseReport from "../lib/models/AbuseReport";
import ModerationLog from "../lib/models/ModerationLog";
import adminBlogsHandler from "../pages/api/admin/blogs";
import adminReviewHandler from "../pages/api/admin/revisao";
import adminModerateHandler from "../pages/api/admin/moderar";
import publicBlogSlugHandler from "../pages/api/blogs/[slug]/index";
import publicBlogPostHandler from "../pages/api/blogs/[slug]/[post]";
import AdministracaoPage from "../pages/administracao";
import BlogManager from "../components/prayer/BlogManager";

const adminId = "507f1f77bcf86cd799439099";
const userId = "507f1f77bcf86cd799439011";
const blogId = "507f1f77bcf86cd799439021";
const postId = "507f1f77bcf86cd799439031";
const reportId = "507f1f77bcf86cd799439041";

function createRes() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  process.env.MONGODB_URI = "mongodb://127.0.0.1/isolated-test-never-connected";
  jest.clearAllMocks();
  getServerSession.mockResolvedValue({
    user: { id: adminId, name: "Administrador", role: "superadmin" },
  });
  ModerationLog.create.mockResolvedValue({ _id: "507f1f77bcf86cd799439088" });
  Blog.countDocuments.mockResolvedValue(1);
  BlogPost.countDocuments.mockResolvedValue(1);
  AbuseReport.countDocuments.mockResolvedValue(0);
});

afterEach(() => {
  delete process.env.MONGODB_URI;
});

describe("Administração de Blogs — Segurança, APIs, Auditoria e Integração Pública", () => {
  test.each([
    [null, 401],
    [{ user: { id: userId, role: "user" } }, 403],
  ])(
    "bloqueia acesso de usuários não autorizados (%p) em GET e PATCH de /api/admin/blogs",
    async (session, expectedStatus) => {
      getServerSession.mockResolvedValue(session);

      const getRes = createRes();
      await adminBlogsHandler({ method: "GET", query: {} }, getRes);
      expect(getRes.status).toHaveBeenCalledWith(expectedStatus);
      expect(Blog.find).not.toHaveBeenCalled();

      const patchRes = createRes();
      await adminBlogsHandler(
        {
          method: "PATCH",
          body: {
            targetType: "blog",
            targetId: blogId,
            action: "disable",
            reason: "Tentativa indevida",
          },
        },
        patchRes,
      );
      expect(patchRes.status).toHaveBeenCalledWith(expectedStatus);
      expect(Blog.updateOne).not.toHaveBeenCalled();
    },
  );

  test("rejeita mutações cross-origin em /api/admin/blogs", async () => {
    const res = createRes();
    await adminBlogsHandler(
      {
        method: "PATCH",
        headers: { "sec-fetch-site": "cross-site" },
        body: {
          targetType: "blog",
          targetId: blogId,
          action: "disable",
          reason: "Teste CSRF",
        },
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Blog.updateOne).not.toHaveBeenCalled();
  });

  test("lista blogs com pesquisa por nome/proprietário, filtro de situação e contadores", async () => {
    User.find
      .mockReturnValueOnce({
        select: () => ({
          lean: async () => [{ _id: userId, name: "Maria" }],
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          lean: async () => [
            { _id: userId, name: "Maria", email: "maria@example.com" },
          ],
        }),
      });

    Blog.find.mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [
              {
                _id: blogId,
                ownerId: userId,
                name: "Caminho de Luz",
                slug: "caminho-de-luz",
                description: "Reflexões diárias.",
                status: "active",
                createdAt: new Date("2026-11-01T10:00:00Z"),
                updatedAt: new Date("2026-11-02T10:00:00Z"),
              },
            ],
          }),
        }),
      }),
    });

    BlogPost.find.mockReturnValue({
      select: () => ({
        lean: async () => [
          {
            _id: postId,
            blogId,
            status: "published",
            updatedAt: new Date("2026-11-05T12:00:00Z"),
            publishedAt: new Date("2026-11-05T12:00:00Z"),
          },
        ],
      }),
    });

    AbuseReport.find.mockReturnValue({
      select: () => ({
        lean: async () => [{ targetId: postId, status: "pending" }],
      }),
    });

    const res = createRes();
    await adminBlogsHandler(
      {
        method: "GET",
        query: { view: "blogs", q: "Maria", status: "active", page: "1" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      _id: blogId,
      name: "Caminho de Luz",
      slug: "caminho-de-luz",
      ownerName: "Maria",
      status: "active",
      postsCount: 1,
      publishedCount: 1,
      pendingReportsCount: 1,
    });
  });

  test("desativa e reativa um blog registrando auditoria sem excluir dados nem alterar estados individuais das publicações", async () => {
    Blog.findById.mockReturnValue({
      lean: async () => ({
        _id: blogId,
        name: "Caminho de Luz",
        slug: "caminho-de-luz",
        status: "active",
      }),
    });

    const disableRes = createRes();
    await adminBlogsHandler(
      {
        method: "PATCH",
        body: {
          targetType: "blog",
          targetId: blogId,
          action: "disable",
          reason: "Desativação preventiva para verificação de relatos.",
        },
      },
      disableRes,
    );

    expect(disableRes.status).toHaveBeenCalledWith(200);
    expect(ModerationLog.create).toHaveBeenCalledWith({
      actorId: adminId,
      action: "disable-blog",
      targetType: "blog",
      targetId: blogId,
      reason: "Desativação preventiva para verificação de relatos.",
    });
    expect(Blog.updateOne).toHaveBeenCalledWith(
      { _id: blogId },
      { $set: { status: "hidden" } },
    );
    expect(BlogPost.updateOne).not.toHaveBeenCalled();

    const enableRes = createRes();
    await adminBlogsHandler(
      {
        method: "PATCH",
        body: {
          targetType: "blog",
          targetId: blogId,
          action: "enable",
          reason: "Reativação após esclarecimento com o autor.",
        },
      },
      enableRes,
    );

    expect(enableRes.status).toHaveBeenCalledWith(200);
    expect(ModerationLog.create).toHaveBeenCalledWith({
      actorId: adminId,
      action: "enable-blog",
      targetType: "blog",
      targetId: blogId,
      reason: "Reativação após esclarecimento com o autor.",
    });
    expect(Blog.updateOne).toHaveBeenCalledWith(
      { _id: blogId },
      { $set: { status: "active" } },
    );
  });

  test("despublica e restaura uma publicação registrando auditoria sem alterar o texto do autor", async () => {
    BlogPost.findById.mockReturnValueOnce({
      lean: async () => ({
        _id: postId,
        blogId,
        title: "Texto de reflexão",
        content: "Conteúdo original escrito pelo autor com respeito.",
        status: "published",
      }),
    });

    const hideRes = createRes();
    await adminBlogsHandler(
      {
        method: "PATCH",
        body: {
          targetType: "blog_post",
          targetId: postId,
          action: "hide",
          reason: "Despublicado para análise de relato.",
        },
      },
      hideRes,
    );

    expect(hideRes.status).toHaveBeenCalledWith(200);
    expect(ModerationLog.create).toHaveBeenCalledWith({
      actorId: adminId,
      action: "hide-blog-post",
      targetType: "blog_post",
      targetId: postId,
      reason: "Despublicado para análise de relato.",
    });
    expect(BlogPost.updateOne).toHaveBeenCalledWith(
      { _id: postId },
      { $set: { status: "hidden" } },
    );
    expect(AbuseReport.updateMany).toHaveBeenCalledWith(
      { targetType: "blog_post", targetId: postId, status: "pending" },
      { $set: { status: "resolved" } },
    );

    BlogPost.findById.mockReturnValueOnce({
      lean: async () => ({
        _id: postId,
        blogId,
        title: "Texto de reflexão",
        content: "Conteúdo original escrito pelo autor com respeito.",
        status: "hidden",
      }),
    });

    const restoreRes = createRes();
    await adminBlogsHandler(
      {
        method: "PATCH",
        body: {
          targetType: "blog_post",
          targetId: postId,
          action: "restore",
          reason: "Conteúdo verificado e restaurado.",
        },
      },
      restoreRes,
    );

    expect(restoreRes.status).toHaveBeenCalledWith(200);
    expect(ModerationLog.create).toHaveBeenCalledWith({
      actorId: adminId,
      action: "restore-blog-post",
      targetType: "blog_post",
      targetId: postId,
      reason: "Conteúdo verificado e restaurado.",
    });
    expect(BlogPost.updateOne).toHaveBeenCalledWith(
      { _id: postId },
      { $set: { status: "published" } },
    );
  });

  test("impede que rascunhos privados do autor sejam publicados ou revisados indevidamente pela administração", async () => {
    BlogPost.findById.mockReturnValue({
      lean: async () => ({
        _id: postId,
        blogId,
        title: "Rascunho particular",
        content: "Texto privado em elaboração.",
        status: "draft",
      }),
      select: () => ({
        lean: async () => ({
          _id: postId,
          status: "draft",
        }),
      }),
    });

    const restoreDraftRes = createRes();
    await adminBlogsHandler(
      {
        method: "PATCH",
        body: {
          targetType: "blog_post",
          targetId: postId,
          action: "restore",
          reason: "Tentativa de publicar rascunho",
        },
      },
      restoreDraftRes,
    );
    expect(restoreDraftRes.status).toHaveBeenCalledWith(409);

    const reviewDraftRes = createRes();
    await adminReviewHandler(
      {
        method: "GET",
        query: { type: "blog_post", id: postId, reason: "Revisão" },
      },
      reviewDraftRes,
    );
    expect(reviewDraftRes.status).toHaveBeenCalledWith(409);

    const moderateDraftRes = createRes();
    await adminModerateHandler(
      {
        method: "PATCH",
        body: {
          type: "blog_post",
          id: postId,
          action: "restore",
          reason: "Tentativa de publicar rascunho",
        },
        query: {},
      },
      moderateDraftRes,
    );
    expect(moderateDraftRes.status).toHaveBeenCalledWith(409);
  });

  test("permite marcar denúncia de blog como resolvida ou improcedente com registro na auditoria", async () => {
    AbuseReport.findOne.mockReturnValue({
      lean: async () => ({
        _id: reportId,
        targetType: "blog_post",
        targetId: postId,
        status: "pending",
      }),
    });

    const dismissRes = createRes();
    await adminBlogsHandler(
      {
        method: "PATCH",
        body: {
          targetType: "report",
          targetId: reportId,
          action: "dismiss",
          reason: "Relato analisado e considerado improcedente.",
        },
      },
      dismissRes,
    );

    expect(dismissRes.status).toHaveBeenCalledWith(200);
    expect(ModerationLog.create).toHaveBeenCalledWith({
      actorId: adminId,
      action: "dismiss-blog-report",
      targetType: "blog_post",
      targetId: postId,
      reason: "Relato analisado e considerado improcedente.",
    });
    expect(AbuseReport.updateOne).toHaveBeenCalledWith(
      { _id: reportId },
      { $set: { status: "dismissed" } },
    );
  });

  test("bloqueia imediatamente o acesso público a blogs desativados e publicações despublicadas", async () => {
    Blog.findOne.mockReturnValueOnce({
      lean: async () => ({
        _id: blogId,
        slug: "caminho-de-luz",
        status: "hidden",
      }),
    });

    const disabledBlogRes = createRes();
    await publicBlogSlugHandler(
      { method: "GET", query: { slug: "caminho-de-luz" } },
      disabledBlogRes,
    );
    expect(disabledBlogRes.status).toHaveBeenCalledWith(404);

    Blog.findOne.mockReturnValueOnce({
      lean: async () => ({
        _id: blogId,
        slug: "caminho-de-luz",
        status: "active",
      }),
    });
    BlogPost.findOne.mockReturnValueOnce({
      lean: async () => ({
        _id: postId,
        blogId,
        slug: "texto-oculto",
        status: "hidden",
      }),
    });

    const hiddenPostRes = createRes();
    await publicBlogPostHandler(
      {
        method: "GET",
        query: { slug: "caminho-de-luz", post: "texto-oculto" },
      },
      hiddenPostRes,
    );
    expect(hiddenPostRes.status).toHaveBeenCalledWith(404);
  });

  test("preserva todas as abas existentes do painel administrativo e exibe a aba Blog e o gerenciador BlogManager", () => {
    const adminHtml = renderToStaticMarkup(<AdministracaoPage />);

    const expectedTabs = [
      "Visão geral",
      "Velas",
      "Relatos",
      "Publicações",
      "Comentários",
      "Participantes",
      "Comunidades",
      "Blog",
      "Rosário",
      "Auditoria",
      "Privacidade",
    ];

    for (const tabTitle of expectedTabs) {
      expect(adminHtml).toContain(`>${tabTitle}</button>`);
    }

    const managerHtml = renderToStaticMarkup(<BlogManager />);
    expect(managerHtml).toContain("Blogs cadastrados");
    expect(managerHtml).toContain("Publicações dos blogs");
    expect(managerHtml).toContain("Denúncias de blogs");
    expect(managerHtml).toContain("Pesquisar por nome do blog ou proprietário");
  });
});
