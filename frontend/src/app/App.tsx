import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppThemeProvider } from "@/theme/AppTheme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { AppLoader } from "@/components/AppLoader";
import { LoginPage } from "@/features/auth/LoginPage";
import { supabase } from "@/lib/supabase";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const CreateTicketPage = lazy(() => import("@/features/tickets/CreateTicketPage").then((m) => ({ default: m.CreateTicketPage })));
const MyTicketsPage = lazy(() => import("@/features/tickets/MyTicketsPage").then((m) => ({ default: m.MyTicketsPage })));
const KnowledgeBasePage = lazy(() => import("@/features/knowledge-base/KnowledgeBasePage").then((m) => ({ default: m.KnowledgeBasePage })));
const AdminChamadosPage = lazy(() => import("@/features/admin/AdminChamadosPage").then((m) => ({ default: m.AdminChamadosPage })));
const TemplateEditorPage = lazy(() => import("@/features/admin/TemplateEditorPage").then((m) => ({ default: m.TemplateEditorPage })));
const UsersPage = lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
const PermissionsPage = lazy(() => import("@/features/admin/PermissionsPage").then((m) => ({ default: m.PermissionsPage })));

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const authConfigured = !!supabase;

  if (authConfigured && loading) return <AppLoader />;
  if (authConfigured && !isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/criar-chamado" element={<CreateTicketPage />} />
          <Route path="/meus-chamados" element={<MyTicketsPage />} />
          <Route path="/base-conhecimento" element={<KnowledgeBasePage />} />
          <Route path="/admin/chamados" element={<AdminChamadosPage />} />
          <Route path="/admin/templates" element={<TemplateEditorPage />} />
          <Route path="/admin/usuarios" element={<UsersPage />} />
          <Route path="/admin/permissoes" element={<PermissionsPage />} />
          <Route path="/painel-administrativo" element={<Navigate to="/admin/chamados" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AppThemeProvider>
    </ThemeProvider>
  );
}
