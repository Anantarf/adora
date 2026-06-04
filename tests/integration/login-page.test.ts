import { beforeEach, describe, expect, test, vi } from "vitest";

const getServerSession = vi.fn();
const redirect = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

describe("Login page redirect", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    redirect.mockReset();
  });

  test("coach diarahkan ke portal coach saat sesi sudah ada", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach-1", role: "COACH" } });
    const LoginPage = (await import("@/app/login/page")).default;

    await LoginPage();

    expect(redirect).toHaveBeenCalledWith("/coach");
  });

  test("parent tetap diarahkan ke portal parent saat sesi sudah ada", async () => {
    getServerSession.mockResolvedValue({ user: { id: "parent-1", role: "PARENT" } });
    const LoginPage = (await import("@/app/login/page")).default;

    await LoginPage();

    expect(redirect).toHaveBeenCalledWith("/parent");
  });
});
