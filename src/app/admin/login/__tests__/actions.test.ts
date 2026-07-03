import { describe, expect, it, vi } from "vitest";

const { adminUserMock } = vi.hoisted(() => ({
  adminUserMock: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    adminUser: adminUserMock,
  },
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  createAdminSession: vi.fn(),
  getRequestMetadata: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("loginAction", () => {
  it("normalizes email before returning the invalid-login error", async () => {
    adminUserMock.findUnique.mockResolvedValueOnce(null);

    const form = new FormData();
    form.set("email", "  ADMIN@Example.COM  ");
    form.set("password", "wrong-password");

    const { loginAction } = await import("../actions");
    const result = await loginAction({}, form);

    expect(result).toEqual({ error: "账号或密码错误" });
    expect(adminUserMock.findUnique).toHaveBeenCalledWith({
      where: { email: "admin@example.com" },
    });
  });
});
