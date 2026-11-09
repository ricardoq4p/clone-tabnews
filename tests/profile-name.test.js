import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../lib/models/Candle", () => ({
  __esModule: true,
  default: {
    updateMany: jest.fn(),
  },
}));
jest.mock("../lib/models/Comment", () => ({
  __esModule: true,
  default: {
    updateMany: jest.fn(),
  },
}));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true, retryAfter: 0 })),
  createRateLimitErrorMessage: jest.fn(() => "Rate limit"),
}));
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({
    pathname: "/profile",
    asPath: "/profile",
    query: {},
    push: jest.fn(),
  })),
}));
jest.mock("browser-image-compression", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import User from "../lib/models/User";
import Candle from "../lib/models/Candle";
import Comment from "../lib/models/Comment";
import {
  MAX_DISPLAY_NAME_LENGTH,
  sanitizeDisplayName,
  validateDisplayName,
} from "../lib/validation";
import { candleView } from "../lib/candles";
import meHandler from "../pages/api/users/me";
import Profile from "../pages/profile";
import Layout from "../components/prayer/Layout";
import CandleCard from "../components/prayer/CandleCard";
import MessageCard from "../components/MessageCard";

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
}

describe("Edição do nome de exibição do usuário", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Candle.updateMany.mockResolvedValue({ modifiedCount: 1 });
    Comment.updateMany.mockResolvedValue({ modifiedCount: 1 });
  });

  test("atualiza o nome de exibição com sucesso e propaga para velas e comentários", async () => {
    getServerSession.mockResolvedValue({
      user: {
        id: "507f1f77bcf86cd799439011",
        email: "sumo@panteralab.com.br",
        name: "sumo",
        role: "user",
      },
    });

    User.findOneAndUpdate.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Irmão João",
      email: "sumo@panteralab.com.br",
      username: "sumo",
      avatar: null,
      role: "user",
      calorieGoal: 1200,
    });

    const req = {
      method: "PATCH",
      headers: {},
      body: {
        name: "  Irmão   João  ",
      },
    };
    const res = createResponse();

    await meHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "507f1f77bcf86cd799439011" },
      { $set: { name: "Irmão João" } },
      { returnDocument: "after" },
    );
    expect(Candle.updateMany).toHaveBeenCalledWith(
      { ownerId: "507f1f77bcf86cd799439011" },
      { $set: { authorName: "Irmão João" } },
    );
    expect(Comment.updateMany).toHaveBeenCalledWith(
      { userId: "507f1f77bcf86cd799439011" },
      { $set: { author: "Irmão João" } },
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Nome de exibição atualizado com sucesso.",
        name: "Irmão João",
        email: "sumo@panteralab.com.br",
        username: "sumo",
      }),
    );
  });

  test("persiste o nome atualizado ao consultar novamente os dados do perfil", async () => {
    getServerSession.mockResolvedValue({
      user: {
        id: "507f1f77bcf86cd799439011",
        email: "sumo@panteralab.com.br",
        name: "Irmão João",
      },
    });

    User.findOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Irmão João",
      email: "sumo@panteralab.com.br",
      username: "sumo",
      avatar: null,
      role: "user",
      calorieGoal: 1200,
    });

    const req = { method: "GET", headers: {} };
    const res = createResponse();

    await meHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Irmão João",
        email: "sumo@panteralab.com.br",
      }),
    );
  });

  test("impede nomes vazios, compostos apenas por espaços ou tags HTML", async () => {
    getServerSession.mockResolvedValue({
      user: {
        id: "507f1f77bcf86cd799439011",
        email: "sumo@panteralab.com.br",
        name: "sumo",
      },
    });

    for (const invalidName of [
      "",
      "   ",
      "\t\n ",
      "<script>   </script>",
      null,
    ]) {
      const req = {
        method: "PATCH",
        headers: {},
        body: { name: invalidName },
      };
      const res = createResponse();

      await meHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    }

    expect(sanitizeDisplayName("<b>Maria</b>   <i>Helena</i>")).toBe(
      "Maria Helena",
    );
  });

  test("respeita o limite máximo de 30 caracteres", async () => {
    getServerSession.mockResolvedValue({
      user: {
        id: "507f1f77bcf86cd799439011",
        email: "sumo@panteralab.com.br",
        name: "sumo",
      },
    });

    const exact30 = "A".repeat(MAX_DISPLAY_NAME_LENGTH);
    const over30 = "A".repeat(MAX_DISPLAY_NAME_LENGTH + 1);

    expect(validateDisplayName(exact30).valid).toBe(true);
    expect(validateDisplayName(over30)).toEqual({
      valid: false,
      value: over30,
      error: `O nome de exibição deve ter no máximo ${MAX_DISPLAY_NAME_LENGTH} caracteres.`,
    });

    const resOver = createResponse();
    await meHandler(
      {
        method: "PATCH",
        headers: {},
        body: { name: over30 },
      },
      resOver,
    );

    expect(resOver.status).toHaveBeenCalledWith(400);
    expect(resOver.json).toHaveBeenCalledWith({
      error: `O nome de exibição deve ter no máximo ${MAX_DISPLAY_NAME_LENGTH} caracteres.`,
    });
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("impede alterar o perfil de outro usuário ou modificar campos sensíveis", async () => {
    // 1. Sem sessão autenticada -> 401
    getServerSession.mockResolvedValueOnce(null);
    const unauthRes = createResponse();
    await meHandler(
      {
        method: "PATCH",
        headers: {},
        body: { name: "Novo Nome" },
      },
      unauthRes,
    );
    expect(unauthRes.status).toHaveBeenCalledWith(401);

    // 2. Tentando enviar ID ou e-mail de outro usuário -> 403
    getServerSession.mockResolvedValue({
      user: {
        id: "507f1f77bcf86cd799439011",
        email: "sumo@panteralab.com.br",
        name: "sumo",
      },
    });

    for (const payload of [
      { userId: "507f1f77bcf86cd799439099", name: "Invasor" },
      { accountId: "507f1f77bcf86cd799439099", name: "Invasor" },
      { id: "outro-id", name: "Invasor" },
      { email: "outro@panteralab.com.br", name: "Invasor" },
    ]) {
      const forbiddenRes = createResponse();
      await meHandler(
        {
          method: "PATCH",
          headers: {},
          body: payload,
        },
        forbiddenRes,
      );
      expect(forbiddenRes.status).toHaveBeenCalledWith(403);
      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    }

    // 3. Campos extras como password, role ou username são ignorados na atualização
    User.findOneAndUpdate.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Nome Seguro",
      email: "sumo@panteralab.com.br",
      username: "sumo",
      role: "user",
    });

    const safeRes = createResponse();
    await meHandler(
      {
        method: "PATCH",
        headers: {},
        body: {
          name: "Nome Seguro",
          role: "superadmin",
          password: "hacked",
          username: "outro-username",
        },
      },
      safeRes,
    );

    expect(safeRes.status).toHaveBeenCalledWith(200);
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "507f1f77bcf86cd799439011" },
      { $set: { name: "Nome Seguro" } },
      { returnDocument: "after" },
    );
  });

  test("renderiza o nome de exibição atualizado nos componentes da plataforma", () => {
    useSession.mockReturnValue({
      data: {
        user: {
          id: "507f1f77bcf86cd799439011",
          name: "Irmã Clara",
          email: "clara@panteralab.com.br",
          role: "user",
        },
      },
      status: "authenticated",
      update: jest.fn(),
    });

    const profileHtml = renderToStaticMarkup(<Profile />);
    expect(profileHtml).toContain("Irmã Clara");
    expect(profileHtml).toContain("clara@panteralab.com.br");
    expect(profileHtml).toContain("Editar nome de exibição");

    const layoutHtml = renderToStaticMarkup(
      <Layout title="Capelinha">
        <div>Conteúdo</div>
      </Layout>,
    );
    expect(layoutHtml).toContain("Irmã Clara");

    const now = Date.now();
    const candleHtml = renderToStaticMarkup(
      <CandleCard
        now={now}
        candle={candleView(
          {
            _id: "507f1f77bcf86cd799439022",
            authorName: "Irmã Clara",
            intention: "Pela paz das famílias.",
            visibility: "public",
            status: "active",
            createdAt: new Date(now),
            expiresAt: new Date(now + 86400000),
          },
          { now: new Date(now), supportCount: 2, prayed: false },
        )}
      />,
    );
    expect(candleHtml).toContain("Irmã Clara");

    const messageHtml = renderToStaticMarkup(
      <MessageCard
        msg={{
          _id: "507f1f77bcf86cd799439033",
          content: "Paz e bem a todos.",
          createdAt: new Date().toISOString(),
          userId: {
            _id: "507f1f77bcf86cd799439011",
            name: "Irmã Clara",
            username: "clara",
          },
        }}
      />,
    );
    expect(messageHtml).toContain("Irmã Clara");
  });
});
