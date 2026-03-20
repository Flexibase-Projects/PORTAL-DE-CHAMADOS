import axios from "axios";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

const AUTH_REQUIRED_PATTERNS = [
  "/tickets/meus-chamados-by-auth",
  "/tickets/recebidos",
  "/dashboard/stats",
  "/notifications",
];

function urlRequiresAuth(url: string): boolean {
  const path = typeof url === "string" ? url.replace(/^.*\/api/, "") : "";
  return AUTH_REQUIRED_PATTERNS.some((p) => path.includes(p));
}

api.interceptors.request.use(async (config) => {
  if (supabase) {
    let session = (await supabase.auth.getSession()).data.session;
    if (!session?.user?.id && urlRequiresAuth(config.url ?? "")) {
      await new Promise((r) => setTimeout(r, 300));
      session = (await supabase.auth.getSession()).data.session;
    }
    if (session?.user?.id) {
      config.headers["x-auth-user-id"] = session.user.id;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
