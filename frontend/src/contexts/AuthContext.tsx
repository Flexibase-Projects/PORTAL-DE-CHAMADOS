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

export type PermissaoTipo = "view" | "view_edit";

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  /** Departamento do usuário (PDC_users.departamento). Só preenchido após GET /me. */
  departamento: string | null;
  /** Permissões por departamento (view/view_edit). Preenchido após GET /me. */
  permissions: Record<string, PermissaoTipo>;
  /** True se o usuário pertence ao departamento TI (acesso à aba Usuários). */
  isTiUser: boolean;
  /** True após a primeira resposta de GET /me (permite saber se já podemos confiar em isTiUser). */
  meLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [departamento, setDepartamento] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, "view" | "view_edit">>({});
  const [meLoaded, setMeLoaded] = useState(false);

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
      if (!newSession) {
        syncedRef.current = null;
        setDepartamento(null);
        setPermissions({});
        setMeLoaded(false);
      }
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

  useEffect(() => {
    if (!session?.user?.id) {
      setDepartamento(null);
      setPermissions({});
      setMeLoaded(false);
      return;
    }
    setMeLoaded(false);
    api
      .get<{ success: boolean; departamento: string | null; permissions?: Record<string, "view" | "view_edit"> }>("/me")
      .then((res) => {
        if (res.data?.success) {
          setDepartamento(res.data.departamento ?? null);
          setPermissions(res.data.permissions ?? {});
        }
        setMeLoaded(true);
      })
      .catch(() => {
        setDepartamento(null);
        setPermissions({});
        setMeLoaded(true);
      });
  }, [session?.user?.id]);

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
    departamento,
    permissions,
    isTiUser: (departamento || "").trim().toUpperCase() === "TI",
    meLoaded,
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
