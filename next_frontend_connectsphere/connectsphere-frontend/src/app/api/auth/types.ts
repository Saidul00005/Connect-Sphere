// types.ts
import { DefaultSession } from "next-auth";

export interface User {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  token: string;
  refreshToken: string;
}

export interface JWT {
  [key: string]: any;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  token?: string;
  refreshToken?: string;
  accessTokenExpiry?: number;
}

export interface SessionExtended extends DefaultSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    token: string;
  };
}