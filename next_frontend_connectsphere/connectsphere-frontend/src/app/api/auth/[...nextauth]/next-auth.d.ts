import "next-auth";


declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    token: string;
    refreshToken: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      token: string;
    };
  }
}