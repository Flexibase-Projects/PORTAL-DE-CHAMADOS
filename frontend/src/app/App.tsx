import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppThemeProvider } from "@/theme/AppTheme";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CreateTicketPage } from "@/features/tickets/CreateTicketPage";
import { MyTicketsPage } from "@/features/tickets/MyTicketsPage";
import { AdminPage } from "@/features/admin/AdminPage";
import { KnowledgeBasePage } from "@/features/knowledge-base/KnowledgeBasePage";

export default function App() {
  return (
    <ThemeProvider>
      <AppThemeProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/criar-chamado" element={<CreateTicketPage />} />
            <Route path="/meus-chamados" element={<MyTicketsPage />} />
            <Route path="/painel-administrativo" element={<AdminPage />} />
            <Route path="/base-conhecimento" element={<KnowledgeBasePage />} />
          </Routes>
        </AppShell>
      </AppThemeProvider>
    </ThemeProvider>
  );
}
