import { createContext } from "react";
import type { User } from "../lib/types";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (
    googleId: string,
    email: string,
    name: string,
    avatarUrl: string | undefined,
    role: "client" | "agent"
  ) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role: "client" | "agent";
  phone?: string;
  businessName?: string;
  businessDescription?: string;
  businessLicense?: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);
