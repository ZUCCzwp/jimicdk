import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/api/client";
import type { UserProfile } from "@/api/types";
import {
  clearUserSession,
  getUserSession,
  setUserSession,
  type UserSession,
} from "@/lib/storage";

type UserContextValue = {
  session: UserSession | null;
  user: UserProfile | null;
  applyAuth: (token: string, expiresAt: string, user: UserProfile) => void;
  refresh: () => Promise<void>;
  logout: () => void;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() => getUserSession());

  useEffect(() => {
    const sync = () => setSession(getUserSession());
    window.addEventListener("jimicdk-user-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("jimicdk-user-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const applyAuth = useCallback((token: string, expiresAt: string, user: UserProfile) => {
    const next: UserSession = { token, expiresAt, user };
    setUserSession(next);
    setSession(next);
  }, []);

  const refresh = useCallback(async () => {
    const current = getUserSession();
    if (!current) {
      setSession(null);
      return;
    }
    try {
      const user = await api.userMe();
      applyAuth(current.token, current.expiresAt, user);
    } catch {
      clearUserSession();
      setSession(null);
    }
  }, [applyAuth]);

  const logout = useCallback(() => {
    clearUserSession();
    setSession(null);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      applyAuth,
      refresh,
      logout,
    }),
    [session, applyAuth, refresh, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
