import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: "ADMIN" | "PARENT" | "COACH";
    username: string | null;
    mustChangePassword?: boolean;
  }

  interface Session {
    // `user` is nullable so the session callback can return `null` when the
    // authenticated user is deleted/revoked mid-session, letting the layout
    // redirect to /login instead of crashing on `session.user.role`. Callers
    // must handle `session.user == null` explicitly.
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "ADMIN" | "PARENT" | "COACH";
      username: string | null;
      mustChangePassword?: boolean;
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "PARENT" | "COACH";
    username: string | null;
    mustChangePassword?: boolean;
  }
}
