import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import api from "@/services/api";

export interface AuthUser {
  id: string;
  email?: string;
  nome?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? undefined,
        nome:
          (session.user.user_metadata?.nome as string) ||
          (session.user.user_metadata?.full_name as string) ||
          session.user.email?.split("@")[0],
      }
    : null;

  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      if (newSession?.user && syncedRef.current !== newSession.user.id) {
        syncedRef.current = newSession.user.id;
        api
          .post("/users/sync-auth", {
            auth_user_id: newSession.user.id,
            email: newSession.user.email ?? "",
            nome: newSession.user.user_metadata?.nome ?? newSession.user.user_metadata?.full_name ?? newSession.user.email?.split("@")[0],
          })
          .catch(() => {});
      }
      if (!newSession) syncedRef.current = null;
    });
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s?.user && syncedRef.current !== s.user.id) {
        syncedRef.current = s.user.id;
        api
          .post("/users/sync-auth", {
            auth_user_id: s.user.id,
            email: s.user.email ?? "",
            nome: s.user.user_metadata?.nome ?? s.user.user_metadata?.full_name ?? s.user.email?.split("@")[0],
          })
          .catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase não configurado." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!session?.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
