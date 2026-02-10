import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  Inbox,
  Settings,
  BookOpen,
  Moon,
  Sun,
  TicketCheck,
} from "lucide-react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@/hooks/useTheme";
import { UserNav } from "./UserNav";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  path: string;
}

const navCategories: { label: string; items: NavItem[] }[] = [
  {
    label: "Início",
    items: [{ title: "Dashboard", icon: LayoutDashboard, path: "/" }],
  },
  {
    label: "Chamados",
    items: [
      { title: "Enviar Chamado", icon: Send, path: "/criar-chamado" },
      { title: "Meus Chamados", icon: Inbox, path: "/meus-chamados" },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        title: "Painel Administrativo",
        icon: Settings,
        path: "/painel-administrativo",
      },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      {
        title: "Base de Conhecimento",
        icon: BookOpen,
        path: "/base-conhecimento",
      },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  onNavigate?: () => void;
  /** Clique no header (ícone) para expandir/retrair menu. Em mobile pode alternar o drawer. */
  onHeaderClick?: () => void;
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  isMobile,
  onNavigate,
  onHeaderClick,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const sidebarAccent = "#7289da";

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", py: 1 }}>
      {/* Header: ícone de chamados, clicável para expandir/retrair menu */}
      <Box sx={{ px: 1.5, py: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title={collapsed ? "Expandir menu" : "Retrair menu"} placement="right">
          <Box
            component="button"
            type="button"
            onClick={onHeaderClick ?? onToggleCollapse}
            aria-label={collapsed ? "Expandir menu" : "Retrair menu"}
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: sidebarAccent,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "none",
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
            }}
          >
            <TicketCheck style={{ width: 20, height: 20 }} />
          </Box>
        </Tooltip>
        {!collapsed && (
          <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
            Portal de Chamados
          </Typography>
        )}
      </Box>
      <Divider />
      {/* Nav */}
      <List sx={{ flex: 1, py: 0, px: 1 }}>
        {navCategories.map((category) => (
          <Box key={category.label}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{ px: 1.5, py: 0.5, display: "block", color: "text.secondary" }}
              >
                {category.label}
              </Typography>
            )}
            {category.items.map((item) => {
              const isActive = location.pathname === item.path;
              const icon = <item.icon style={{ width: 20, height: 20 }} />;
              return (
                <Tooltip key={item.path} title={collapsed ? item.title : ""} placement="right">
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleNav(item.path)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.25,
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 1.5 : 1.5,
                      "&:hover": { bgcolor: "rgba(114, 137, 218, 0.12)" },
                      "&.Mui-selected": { bgcolor: "rgba(114, 137, 218, 0.2)", color: sidebarAccent },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: collapsed ? "auto" : 40 }}>{icon}</ListItemIcon>
                    {!collapsed && <ListItemText primary={item.title} primaryTypographyProps={{ variant: "body2" }} />}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </List>
      <Divider />
      <List sx={{ py: 0, px: 1 }}>
        <Tooltip title={theme === "light" ? "Modo escuro" : "Modo claro"} placement="right">
          <ListItemButton
            onClick={toggleTheme}
            sx={{
              borderRadius: 1,
              justifyContent: collapsed ? "center" : "flex-start",
              px: 1.5,
              "&:hover": { bgcolor: "rgba(114, 137, 218, 0.12)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? "auto" : 40 }}>
              {theme === "light" ? (
                <Moon style={{ width: 20, height: 20 }} />
              ) : (
                <Sun style={{ width: 20, height: 20 }} />
              )}
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Alternar tema" primaryTypographyProps={{ variant: "body2" }} />}
          </ListItemButton>
        </Tooltip>
        <UserNav collapsed={collapsed} sidebarAccent={sidebarAccent} />
      </List>
    </Box>
  );
}
