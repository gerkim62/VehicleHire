import {
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { User } from "../lib/types";
import type { Id } from "../../convex/_generated/dataModel";
import { hashPassword } from "../lib/utils";
import { AuthContext, type RegisterData } from "./AuthContext";

const STORAGE_KEY = "vh_uid";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(() => {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (s as Id<"users">) : null;
  });
  const loginMutation = useMutation(api.users.loginUser);
  const registerMutation = useMutation(api.users.register);
  const googleAuthMutation = useMutation(api.users.googleAuth);
  const userResult = useQuery(api.users.getUser, userId ? { userId } : "skip");

  const isLoading = userId !== null && userResult === undefined;

  const login = async (email: string, password: string) => {
    const hash = await hashPassword(password);
    const id = await loginMutation({ email, passwordHash: hash });
    localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  };

  const loginWithGoogle = async (
    googleId: string,
    email: string,
    name: string,
    avatarUrl: string | undefined,
    role: "client" | "agent"
  ) => {
    const id = await googleAuthMutation({
      googleId,
      email,
      name,
      avatarUrl,
      role,
    });
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
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
