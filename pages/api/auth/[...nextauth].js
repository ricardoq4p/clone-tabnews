import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import connectToDatabase from "../../../lib/db";
import User from "../../../lib/models/User";
import { getRoleForEmail, isSuperadminEmail, normalizeEmail } from "@/lib/auth";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha obrigatorios");
        }

        await connectToDatabase();

        const normalizedEmail = normalizeEmail(credentials.email);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
          throw new Error("Usuario nao encontrado");
        }

        const expectedRole = getRoleForEmail(normalizedEmail);
        const needsRoleUpdate =
          user.role !== expectedRole ||
          (isSuperadminEmail(normalizedEmail) && !user.isVerified);

        if (needsRoleUpdate) {
          user.role = expectedRole;
          if (isSuperadminEmail(normalizedEmail)) {
            user.isVerified = true;
          }
          await user.save();
        }

        if (!user.isVerified) {
          throw new Error("Por favor, verifique seu email primeiro");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Senha invalida");
        }

        user.lastLoginAt = new Date();
        user.lastSeenAt = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || expectedRole,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      return token;
    },

    async session({ session, token }) {
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
