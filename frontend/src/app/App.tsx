import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppThemeProvider } from "@/theme/AppTheme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { AppLoader } from "@/components/AppLoader";
import { LoginPage } from "@/features/auth/LoginPage";
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
import { CreateTicketPage } from "@/features/tickets/CreateTicketPage";
import CreateTicketSelectDepartmentsPage from "@/features/tickets/CreateTicketSelectDepartmentsPage";
import { MyTicketsPage } from "@/features/tickets/MyTicketsPage";
import { TicketDetailPage } from "@/features/tickets/TicketDetailPage";
const AdminChamadosPage = lazy(() => import("@/features/admin/AdminChamadosPage").then((m) => ({ default: m.AdminChamadosPage })));
const AdminCalendarPage = lazy(() => import("@/features/admin/AdminCalendarPage").then((m) => ({ default: m.AdminCalendarPage })));
const TemplateEditorPage = lazy(() => import("@/features/admin/TemplateEditorPage").then((m) => ({ default: m.TemplateEditorPage })));
const UsersPage = lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
import { supabase } from "@/lib/supabase";

/** Só renderiza a tela de Usuários se o usuário for do departamento TI; caso contrário redireciona. */
function UsersPageGate() {
  const { isTiUser, meLoaded } = useAuth();
  if (!meLoaded) return <AppLoader />;
  if (!isTiUser) return <Navigate to="/" replace />;
  return <UsersPage />;
}

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
          <Route path="/criar-chamado" element={<CreateTicketSelectDepartmentsPage />} />
          <Route path="/criar-chamado/formulario" element={<CreateTicketPage />} />
          <Route path="/meus-chamados" element={<MyTicketsPage />} />
          <Route path="/meus-chamados/:id" element={<TicketDetailPage />} />
          <Route path="/admin/chamados" element={<AdminChamadosPage />} />
          <Route path="/admin/calendario" element={<AdminCalendarPage />} />
          <Route path="/admin/templates" element={<TemplateEditorPage />} />
          <Route path="/admin/usuarios" element={<UsersPageGate />} />
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
