import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import authConfig from "@/lib/auth.config";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const normalizedEmail = email.toLowerCase();
        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          password,
          user.hashedPassword,
        );
        if (!passwordMatch) return null;

        const row = user as Record<string, unknown>;
        const displayName =
          row.name === null || typeof row.name === "string"
            ? row.name
            : null;

        return {
          id: user.id,
          email: user.email,
          name: displayName,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? null;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name =
          (token.name as string | null | undefined) ?? null;
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },
});
