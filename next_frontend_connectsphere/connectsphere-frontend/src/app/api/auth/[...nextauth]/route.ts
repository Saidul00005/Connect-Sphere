import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import { signOut } from "next-auth/react";
import { User, SessionExtended, JWT } from "@/app/api/auth/types";
import type { NextAuthOptions } from "next-auth"
import axios from "axios";

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
          const response = await axios.post(
            `${process.env.BACKEND_URL}/api/accounts/login/`,
            {
              email: credentials.email,
              password: credentials.password,
              role: credentials.role,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key": process.env.BACKEND_API_KEY,
              },
            }
          );

          const userResponse = response.data;
          console.log(userResponse)

          if (!userResponse.access || !userResponse.refresh || !userResponse.user) {
            throw new Error("Invalid response from backend: Missing user, access token, or refresh token.");
          }

          const user: User = userResponse.user;

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.first_name + " " + user.last_name,
            role: user.role,
            is_active: user.is_active,
            token: userResponse.access,
            refreshToken: userResponse.refresh,
          };
        } catch (error) {
          let errorMessage = "500: Failed to authenticate.";
          if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const detail = error.response?.data?.detail
              || error.response?.data?.error
              || error.message
              || "Unknown error occurred";
            errorMessage = `${status}: ${detail}`;
          } else if (error instanceof Error) {
            errorMessage = `500: ${error.message}`;
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
    updateAge: 5 * 60,
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
        token.accessTokenExpiry = Date.now() + 45 * 60 * 1000; // Set expiry (45 minutes)
      }

      // const isTokenExpired =
      //   typeof token.accessTokenExpiry === "number" &&
      //   Date.now() >= token.accessTokenExpiry;
      // const isTokenNeartoExpiry =
      //   typeof token.accessTokenExpiry === "number" &&
      //   Date.now() >= token.accessTokenExpiry - 10 * 60 * 1000;

      if (token.accessTokenExpiry && typeof token.accessTokenExpiry === "number") {
        if (Date.now() > token.accessTokenExpiry) {
          try {
            // token.isRefreshing = true;
            const response = await axios.post(
              `${process.env.BACKEND_URL}/api/accounts/pytoken/refresh/`,
              { refresh: token.refreshToken },
              {
                headers: {
                  "Content-Type": "application/json",
                  "X-Api-Key": process.env.BACKEND_API_KEY
                },
              }
            );
            console.log(response.data)
            token.token = response.data.access;
            token.refreshToken = response.data.refresh
            token.accessTokenExpiry = Date.now() + 45 * 60 * 1000;
          } catch (error) {
            console.error("Token refresh error:");

            let errorMessage = "500: Failed to refresh token";
            if (axios.isAxiosError(error)) {
              const status = error.response?.status || 500;
              const detail = error.response?.data?.detail
                || error.response?.data?.error
                || error.message
                || "Unknown refresh error";
              errorMessage = `${status}: ${detail}`;
              console.error(`Axios error - Status: ${status}, Detail: ${detail}`);
            } else if (error instanceof Error) {
              errorMessage = `500: ${error.message}`;
              console.error("Generic error:", error.message);
            }
            token = {} as JWT;
            throw new Error(errorMessage);
          }
          // finally {
          //   token.isRefreshing = false;
          // }
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };