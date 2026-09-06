import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "agent" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: "agent" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "agent" | "admin";
  }
}
