import { isProductionTestAccount } from "@/lib/integration-policy";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import connectToDatabase from "../../../lib/db";
import User from "../../../lib/models/User";
import { normalizeEmail } from "@/lib/auth";
import { isSessionCurrent } from "@/lib/permissions";
import { createRateLimitErrorMessage, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha obrigatorios");
        }

        const normalizedEmail = normalizeEmail(credentials.email);
        if (isProductionTestAccount(normalizedEmail))
          throw new Error("Email e senha invalidos");
        const rateLimitResult = await checkRateLimit({
          ip: getClientIp(req),
          identity: normalizedEmail,
          key: `login:${getClientIp(req)}:${normalizedEmail || "anon"}`,
          limit: Number(process.env.RATE_LIMIT_LOGIN_MAX || 10),
          windowMs: Number(
            process.env.RATE_LIMIT_LOGIN_WINDOW_MS || 15 * 60 * 1000,
          ),
        });

        if (!rateLimitResult.success) {
          throw new Error(
            createRateLimitErrorMessage(
              "Muitas tentativas de login.",
              rateLimitResult.retryAfter,
            ),
          );
        }

        await connectToDatabase();

        const user = await User.findOne({ email: normalizedEmail });

        if (
          !user ||
          typeof credentials.password !== "string" ||
          !(await compare(credentials.password, user.password)) ||
          !user.isVerified ||
          user.disabledAt
        ) {
          throw new Error("Email ou senha invalidos");
        }

        user.lastLoginAt = new Date();
        user.lastSeenAt = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || "user",
          sessionVersion: user.sessionVersion || 0,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      await connectToDatabase();
      const currentUser = token.id
        ? await User.findById(token.id).select(
            "role isVerified disabledAt sessionVersion",
          )
        : null;
      token.valid = isSessionCurrent(currentUser, token);
      token.role = token.valid ? currentUser.role : null;
      return token;
    },

    async session({ session, token }) {
      // NextAuth 4 serializes null as an empty HTTP body. Its client and
      // getServerSession both map an empty JSON object to an absent session.
      if (!token.valid) return {};
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
