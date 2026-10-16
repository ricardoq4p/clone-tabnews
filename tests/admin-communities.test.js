jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/pusher", () => ({ notifyChange: jest.fn() }));
jest.mock("../lib/models/Community", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
import { getServerSession } from "next-auth";
import Community from "../lib/models/Community";
import list from "../pages/api/admin/comunidades";
import community from "../pages/api/communities/[id]/index";
import { canReadCommunity, canReadMessage } from "../lib/permissions";
const id = "123456789012345678901234";
const response = () => ({
  setHeader: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});
beforeEach(() => {
  process.env.MONGODB_URI = "mongodb://127.0.0.1/isolated-never-connected";
  getServerSession.mockResolvedValue({ user: { id, role: "superadmin" } });
  Community.findById.mockResolvedValue({
    _id: id,
    ownerId: "other",
    name: "Grupo",
    description: "Descrição",
    privacy: "private",
    avatar: "",
    save: jest.fn(),
    populate: jest.fn(async function () {
      return this;
    }),
    members: [],
  });
  Community.findOne.mockResolvedValue(null);
});
afterEach(() => {
  delete process.env.MONGODB_URI;
});
test.each([null, { user: { id, role: "user" } }])(
  "administrative listing rejects unauthorized sessions",
  async (session) => {
    getServerSession.mockResolvedValue(session);
    const res = response();
    await list({ method: "GET", query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(session ? 403 : 401);
    expect(Community.find).not.toHaveBeenCalled();
  },
);
test("listing escapes search, filters, sorts and paginates; never returns membership IDs", async () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest
      .fn()
      .mockResolvedValue([
        { _id: id, name: "Grupo", members: [id], ownerId: { name: "Ana" } },
      ]),
  };
  Community.find.mockReturnValue(chain);
  Community.countDocuments.mockResolvedValue(21);
  const res = response();
  await list(
    {
      method: "GET",
      query: { q: "a.*", privacy: "private", sort: "name", page: "2" },
    },
    res,
  );
  expect(Community.find).toHaveBeenCalledWith({
    deletedAt: null,
    privacy: "private",
    name: { $regex: "a\\.\\*", $options: "i" },
  });
  expect(chain.skip).toHaveBeenCalledWith(20);
  expect(chain.sort).toHaveBeenCalledWith({ name: 1, _id: 1 });
  expect(res.json.mock.calls[0][0].items[0]).toEqual({
    _id: id,
    name: "Grupo",
    ownerName: "Ana",
    membersCount: 1,
  });
});
test.each([{ page: "0" }, { q: ["x"] }, { sort: "bad" }, { privacy: "bad" }])(
  "invalid filters are rejected",
  async (query) => {
    const res = response();
    await list({ method: "GET", query }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  },
);
test.each(["PATCH", "DELETE"])(
  "ordinary nonowners cannot %s",
  async (method) => {
    getServerSession.mockResolvedValue({ user: { id, role: "user" } });
    const res = response();
    await community({ method, query: { id }, body: { name: "Outro" } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Community.findByIdAndUpdate).not.toHaveBeenCalled();
  },
);
test.each(["PATCH", "DELETE"])(
  "unauthenticated mutation rejects %s",
  async (method) => {
    getServerSession.mockResolvedValue(null);
    const res = response();
    await community({ method, query: { id }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(Community.findById).not.toHaveBeenCalled();
  },
);
test("owners retain editing permission", async () => {
  getServerSession.mockResolvedValue({ user: { id: "other", role: "user" } });
  const res = response();
  await community(
    { method: "PATCH", query: { id }, body: { name: "Novo" } },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(200);
});
test.each(["PATCH", "DELETE"])(
  "cross-origin mutation rejects %s",
  async (method) => {
    const res = response();
    await community(
      {
        method,
        headers: { "sec-fetch-site": "cross-site" },
        query: { id },
        body: {},
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Community.findById).not.toHaveBeenCalled();
  },
);
test("partial editing preserves privacy, description, image, owner and members", async () => {
  const res = response();
  await community(
    { method: "PATCH", query: { id }, body: { name: "Novo" } },
    res,
  );
  const doc = await Community.findById.mock.results[0].value;
  expect(doc).toMatchObject({
    name: "Novo",
    description: "Descrição",
    privacy: "private",
    avatar: "",
    ownerId: "other",
    members: [],
  });
  expect(doc.save).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(200);
});
test("deletion archives only the community, retaining every reference", async () => {
  const res = response();
  await community({ method: "DELETE", query: { id } }, res);
  expect(Community.findByIdAndUpdate).toHaveBeenCalledWith(id, {
    $set: { deletedAt: expect.any(Date) },
  });
  expect(res.status).toHaveBeenCalledWith(200);
  const archived = {
    privacy: "public",
    deletedAt: new Date(),
    ownerId: id,
    members: [id],
  };
  expect(canReadCommunity(archived, id)).toBe(false);
  expect(canReadMessage({ communityId: "x" }, archived, id)).toBe(false);
});
test("private viewing still requires membership even for an administrator", async () => {
  Community.findById.mockReturnValueOnce({
    populate: jest.fn().mockResolvedValue({
      _id: id,
      privacy: "private",
      ownerId: "other",
      members: [],
    }),
  });
  const res = response();
  await community({ method: "GET", query: { id } }, res);
  expect(res.status).toHaveBeenCalledWith(404);
});
test("database failure never reports deletion success", async () => {
  Community.findByIdAndUpdate.mockRejectedValueOnce(
    new Error("test database failure"),
  );
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const res = response();
    await community({ method: "DELETE", query: { id } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).not.toHaveBeenCalledWith({ success: true });
  } finally {
    log.mockRestore();
  }
});
test.each(["PATCH", "DELETE"])(
  "invalid identifiers cannot %s",
  async (method) => {
    const res = response();
    await community({ method, query: { id: "invalid" }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Community.findById).not.toHaveBeenCalled();
  },
);
