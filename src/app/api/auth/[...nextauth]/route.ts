// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "../../../../lib/db";
import User from "./../../../../models/User";
import { NextRequest, NextResponse } from "next/server";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await dbConnect();
        
        const user = await User.findOne({ 
          email: credentials.email.toLowerCase() 
        }) as { 
          _id: string; 
          email: string; 
          fullName: string; 
          role: string; 
          verified: boolean; 
          comparePassword: (password: string) => Promise<boolean> 
        };

        if (!user) throw new Error("User not registered");
        if (!user.verified) throw new Error("Email not verified");
        if (user.role !== 'admin') throw new Error("Admin role required");

        const isPasswordValid = await user.comparePassword(credentials.password);
        if (!isPasswordValid) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export async function GET(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return handler(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return handler(request, context);
}

// Optional: Add other methods if needed
export async function PUT(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}