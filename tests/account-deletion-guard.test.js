jest.mock("next-auth", () => ({
  getServerSession: jest.fn(async () => ({
    user: { id: "123456789012345678901235", role: "superadmin" },
  })),
}));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(async () => ({ name: "Participante" })),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock("../lib/models/Message", () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));
jest.mock("../lib/models/Comment", () => ({ __esModule: true, default: {} }));
jest.mock("../lib/models/Community", () => ({ __esModule: true, default: {} }));
jest.mock("../lib/models/Candle", () => ({
  __esModule: true,
  default: { exists: jest.fn(async () => ({ _id: "private-record" })) },
}));
jest.mock("../lib/models/PrayerSupport", () => ({
  __esModule: true,
  default: { exists: jest.fn(async () => null) },
}));
jest.mock("../lib/models/RosaryProgress", () => ({
  __esModule: true,
  default: { exists: jest.fn(async () => null) },
}));
jest.mock("../lib/models/PrivacyRequest", () => ({
  __esModule: true,
  default: { exists: jest.fn(async () => null) },
}));
jest.mock("../lib/models/CalorieEntry", () => ({
  __esModule: true,
  default: { exists: jest.fn(async () => null) },
}));
import User from "../lib/models/User";
import Message from "../lib/models/Message";
import handler from "../pages/api/admin/users/[id]";
test("legacy user deletion cannot orphan private prayer data", async () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
  };
  await handler(
    { method: "DELETE", query: { id: "123456789012345678901234" } },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(409);
  expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  expect(Message.find).not.toHaveBeenCalled();
});
