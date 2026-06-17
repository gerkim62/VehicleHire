import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { User } from "../lib/types";
import type { Id } from "../../convex/_generated/dataModel";
import { hashPassword } from "../lib/utils";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "vh_uid";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(() => {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (s as Id<"users">) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useMutation(api.users.loginUser);
  const registerMutation = useMutation(api.users.register);
  const userResult = useQuery(api.users.getUser, userId ? { userId } : "skip");

  useEffect(() => {
    if (!userId || userResult !== undefined) setIsLoading(false);
  }, [userId, userResult]);

  const login = async (email: string, password: string) => {
    const hash = await hashPassword(password);
    const id = await loginMutation({ email, passwordHash: hash });
    localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  };

  const register = async (data: RegisterData) => {
    const hash = await hashPassword(data.password);
    const id = await registerMutation({
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash: hash,
      phone: data.phone,
      businessName: data.businessName,
      businessDescription: data.businessDescription,
      businessLicense: data.businessLicense,
    });
    localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: (userResult as User) ?? null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
