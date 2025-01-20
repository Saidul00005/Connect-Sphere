// next-auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signOut } from "next-auth/react";
import { User, SessionExtended, JWT } from "@/app/api/auth/types";
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password || !credentials.role) {
          throw new Error("Email, Password, and Role are required.");
        }
        try {
          const res = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              role: credentials.role,
            }),
          });

          const userResponse = await res.json();

          if (!res.ok) {
            throw new Error("Failed to log in: Invalid credentials or server error.");
          }

          if (!userResponse.access || !userResponse.refresh || !userResponse.user) {
            throw new Error("Invalid response from backend: Missing user, access token, or refresh token.");
          }

          const user: User = userResponse.user;

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.first_name + user.last_name,
            role: user.role,
            is_active: user.is_active,
            profile_picture: user.profile_picture,
            token: userResponse.access,
            refreshToken: userResponse.refresh,
          };
        } catch (error) {
          let errorMessage = "Failed to authenticate.";
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === "string") {
            errorMessage = error;
          } else if (error && typeof error === "object" && "message" in error) {
            errorMessage = String(error.message);
          }
          console.error("Authorization error:", errorMessage);
          throw new Error(errorMessage);
        }
      },
    }),
  ],
  pages: {
    signIn: "/logIn",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.token = user.token;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpiry = Date.now() + 50 * 60 * 1000; // Set expiry (50 minutes)
      }

      // Handle token expiration and refresh
      if (token.accessTokenExpiry && typeof token.accessTokenExpiry === "number") {
        if (Date.now() > token.accessTokenExpiry - 10 * 60 * 1000) {
          try {
            const res = await fetch("http://127.0.0.1:8000/api/accounts/pytoken/refresh/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: token.refreshToken }),
            });

            if (!res.ok) {
              const errorResponse = await res.json();
              const errorMessage = errorResponse?.error || res.statusText || "Unknown error";
              throw new Error(`Failed to refresh access token: ${errorMessage} (Status: ${res.status})`);
            }

            const data = await res.json();
            token.token = data.access;
            token.accessTokenExpiry = Date.now() + 50 * 60 * 1000;
          } catch (error) {
            console.error("Error refreshing access token:", error);
            token = {} as JWT;
            await signOut({ redirect: false });
            throw new Error("Session expired. Please log in again.");
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as string,
        token: token.token as string,
      };
      return session as SessionExtended;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/") || url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions)