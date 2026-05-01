// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: '/', 
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          throw new Error("AUTH_INVALID_CREDENTIALS");
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isValid) {
          throw new Error("AUTH_INVALID_CREDENTIALS");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        // @ts-ignore
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
        if (user) {
            token.sub = user.id;
        }
        return token;
    }
  }
});