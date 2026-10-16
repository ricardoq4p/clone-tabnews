jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/pusher", () => ({ notifyChange: jest.fn() }));
jest.mock("../lib/models/Community", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
  createRateLimitErrorMessage: jest.fn((msg) => msg),
}));

import { getServerSession } from "next-auth";
import Community from "../lib/models/Community";
import createCommunity from "../pages/api/communities/index";
import updateCommunity from "../pages/api/communities/[id]/index";
import { validImageUrl } from "../lib/validation";
import {
  serverIntegrationEnabled,
  uploadsEnabled,
} from "../lib/integration-policy";
import CommunityImageUploader from "../components/CommunityImageUploader";

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

describe("Community Image Upload & Security Validations", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "pantera-cloud",
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: "community-preset",
      NEXT_PUBLIC_UPLOADS_ENABLED: "true",
      MONGODB_URI: "mongodb://127.0.0.1/isolated-test",
    };
    getServerSession.mockResolvedValue({
      user: { id: "123456789012345678901234", role: "user" },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  test("CommunityImageUploader is defined and exports correctly", () => {
    expect(typeof CommunityImageUploader).toBe("function");
  });

  describe("validImageUrl security validator", () => {
    test("accepts valid Cloudinary HTTPS URL belonging to the configured cloud name", () => {
      const validUrl =
        "https://res.cloudinary.com/pantera-cloud/image/upload/v12345/comunidade.png";
      expect(validImageUrl(validUrl)).toBe(true);
    });

    test("rejects invalid protocols (http, ftp, javascript, data)", () => {
      expect(
        validImageUrl(
          "http://res.cloudinary.com/pantera-cloud/image/upload/v12345/comunidade.png",
        ),
      ).toBe(false);
      expect(validImageUrl("javascript:alert(1)")).toBe(false);
      expect(
        validImageUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="),
      ).toBe(false);
    });

    test("rejects URLs from other hostnames or domains trying to spoof Cloudinary", () => {
      expect(
        validImageUrl(
          "https://res.cloudinary.com.attacker.com/pantera-cloud/image/upload/test.jpg",
        ),
      ).toBe(false);
      expect(
        validImageUrl(
          "https://evil.com/res.cloudinary.com/pantera-cloud/image/upload/test.jpg",
        ),
      ).toBe(false);
      expect(
        validImageUrl(
          "https://res.cloudinary.com/another-cloud-name/image/upload/test.jpg",
        ),
      ).toBe(false);
    });

    test("rejects URLs with embedded credentials or malformed formats", () => {
      expect(
        validImageUrl(
          "https://user:pass@res.cloudinary.com/pantera-cloud/image/upload/test.jpg",
        ),
      ).toBe(false);
      expect(validImageUrl("")).toBe(false);
      expect(validImageUrl(null)).toBe(false);
      expect(validImageUrl(undefined)).toBe(false);
      expect(validImageUrl("a".repeat(2049))).toBe(false);
    });
  });

  describe("Integration policy for uploads", () => {
    test("uploadsEnabled respects NEXT_PUBLIC_UPLOADS_ENABLED in production", () => {
      expect(
        serverIntegrationEnabled("uploads", {
          VERCEL_ENV: "production",
          NEXT_PUBLIC_UPLOADS_ENABLED: "true",
        }),
      ).toBe(true);

      expect(
        serverIntegrationEnabled("uploads", {
          VERCEL_ENV: "production",
          NEXT_PUBLIC_UPLOADS_ENABLED: "false",
        }),
      ).toBe(false);
    });
  });

  describe("POST /api/communities image validation and persistence", () => {
    test("creates community with valid Cloudinary avatar", async () => {
      Community.findOne.mockResolvedValueOnce(null);
      Community.create.mockResolvedValueOnce({
        _id: "123456789012345678901239",
        name: "Comunidade com Imagem",
        description: "Descrição da comunidade",
        avatar:
          "https://res.cloudinary.com/pantera-cloud/image/upload/v1/foto.png",
        privacy: "public",
        ownerId: "123456789012345678901234",
        members: ["123456789012345678901234"],
        populate: jest.fn().mockResolvedValue({
          _id: "123456789012345678901239",
          name: "Comunidade com Imagem",
          description: "Descrição da comunidade",
          avatar:
            "https://res.cloudinary.com/pantera-cloud/image/upload/v1/foto.png",
          privacy: "public",
          ownerId: { _id: "123456789012345678901234", name: "Ricardo" },
          members: ["123456789012345678901234"],
          createdAt: new Date().toISOString(),
        }),
      });

      const res = mockResponse();
      await createCommunity(
        {
          method: "POST",
          body: {
            name: "Comunidade com Imagem",
            description: "Descrição da comunidade",
            avatar:
              "https://res.cloudinary.com/pantera-cloud/image/upload/v1/foto.png",
            privacy: "public",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Community.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Comunidade com Imagem",
          avatar:
            "https://res.cloudinary.com/pantera-cloud/image/upload/v1/foto.png",
        }),
      );
    });

    test("rejects community creation when avatar is an unauthorized URL", async () => {
      const res = mockResponse();
      await createCommunity(
        {
          method: "POST",
          body: {
            name: "Comunidade Insegura",
            description: "Descrição",
            avatar: "https://malicious-site.com/image.png",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Imagem da comunidade inválida" }),
      );
      expect(Community.create).not.toHaveBeenCalled();
    });

    test("allows creating community without avatar", async () => {
      Community.findOne.mockResolvedValueOnce(null);
      Community.create.mockResolvedValueOnce({
        _id: "123456789012345678901239",
        name: "Sem Imagem",
        description: "Descrição",
        avatar: "",
        privacy: "public",
        ownerId: "123456789012345678901234",
        members: ["123456789012345678901234"],
        populate: jest.fn().mockResolvedValue({
          _id: "123456789012345678901239",
          name: "Sem Imagem",
          description: "Descrição",
          avatar: "",
          privacy: "public",
          ownerId: { _id: "123456789012345678901234", name: "Ricardo" },
          members: ["123456789012345678901234"],
          createdAt: new Date().toISOString(),
        }),
      });

      const res = mockResponse();
      await createCommunity(
        {
          method: "POST",
          body: {
            name: "Sem Imagem",
            description: "Descrição",
            avatar: "",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Community.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sem Imagem",
          avatar: "",
        }),
      );
    });
  });

  describe("PATCH /api/communities/[id] image update and persistence", () => {
    test("updates community with new valid Cloudinary avatar", async () => {
      const communityDoc = {
        _id: "123456789012345678901234",
        ownerId: "123456789012345678901234",
        name: "Nome Existente",
        description: "Descrição",
        avatar: "",
        privacy: "public",
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: "123456789012345678901234",
          ownerId: { _id: "123456789012345678901234", name: "Ricardo" },
          name: "Nome Existente",
          description: "Descrição",
          avatar:
            "https://res.cloudinary.com/pantera-cloud/image/upload/v2/nova.png",
          privacy: "public",
          members: ["123456789012345678901234"],
        }),
        members: ["123456789012345678901234"],
      };

      Community.findById.mockResolvedValueOnce(communityDoc);
      Community.findOne.mockResolvedValueOnce(null);

      const res = mockResponse();
      await updateCommunity(
        {
          method: "PATCH",
          query: { id: "123456789012345678901234" },
          body: {
            name: "Nome Existente",
            avatar:
              "https://res.cloudinary.com/pantera-cloud/image/upload/v2/nova.png",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(communityDoc.avatar).toBe(
        "https://res.cloudinary.com/pantera-cloud/image/upload/v2/nova.png",
      );
      expect(communityDoc.save).toHaveBeenCalled();
    });

    test("rejects PATCH when avatar is an unauthorized URL", async () => {
      const communityDoc = {
        _id: "123456789012345678901234",
        ownerId: "123456789012345678901234",
        name: "Nome Existente",
        description: "Descrição",
        avatar: "",
        privacy: "public",
        save: jest.fn(),
      };

      Community.findById.mockResolvedValueOnce(communityDoc);

      const res = mockResponse();
      await updateCommunity(
        {
          method: "PATCH",
          query: { id: "123456789012345678901234" },
          body: {
            name: "Nome Existente",
            avatar: "https://insecure-domain.com/evil.jpg",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Imagem da comunidade inválida" }),
      );
      expect(communityDoc.save).not.toHaveBeenCalled();
    });
  });
});
