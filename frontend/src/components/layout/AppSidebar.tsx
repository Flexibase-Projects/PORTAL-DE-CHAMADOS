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
  ChevronLeft,
  Menu,
  HelpCircle,
  FolderOpen,
  FileEdit,
  Users,
  Shield,
} from "lucide-react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
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
      { title: "Gestão de Chamados", icon: TicketCheck, path: "/admin/chamados" },
      { title: "Templates", icon: FileEdit, path: "/admin/templates" },
      { title: "Usuários", icon: Users, path: "/admin/usuarios" },
      { title: "Permissões", icon: Shield, path: "/admin/permissoes" },
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
  /** No mobile: fecha o drawer ao clicar no botão de toggle. */
  onHeaderClick?: () => void;
}

const SIDEBAR_ACCENT = "#2563eb";
const ICON_SIZE = 18;
const LOGO_SIZE = 28;

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

  const handleToggle = () => {
    if (isMobile) onHeaderClick?.();
    else onToggleCollapse();
  };

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const toggleLabel = isMobile
    ? "Fechar menu"
    : collapsed
      ? "Expandir menu"
      : "Retrair menu";
  const ToggleIcon = isMobile || !collapsed ? ChevronLeft : Menu;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        py: 0.75,
        minHeight: 0,
      }}
    >
      {/* --- Expandido: Logo + Título à esquerda, botão retrair à direita --- */}
      {!collapsed && (
        <>
          <Box
            sx={{
              px: 1.25,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1,
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                borderRadius: 1,
                bgcolor: SIDEBAR_ACCENT,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-hidden
            >
              <TicketCheck style={{ width: 16, height: 16 }} />
            </Box>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ flex: 1, minWidth: 0, fontSize: "0.8125rem" }}
            >
              Portal de Chamados
            </Typography>
            <Tooltip title={toggleLabel} placement="right">
              <IconButton
                size="small"
                onClick={handleToggle}
                aria-label={toggleLabel}
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                }}
              >
                <ToggleIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ my: 0.25, borderBottomWidth: 0.5 }} />
        </>
      )}

      {/* --- Retraído: Logo, Divider, Botão expandir, Divider --- */}
      {collapsed && (
        <>
          <Box
            sx={{
              px: 0,
              py: 1.25,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
            }}
          >
            <Box
              sx={{
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                borderRadius: 1,
                bgcolor: SIDEBAR_ACCENT,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-hidden
            >
              <TicketCheck style={{ width: 16, height: 16 }} />
            </Box>
          </Box>
          <Divider sx={{ my: 0.25, borderBottomWidth: 0.5 }} />
          <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
            <Tooltip title={toggleLabel} placement="right">
              <IconButton
                size="small"
                onClick={handleToggle}
                aria-label={toggleLabel}
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                }}
              >
                <Menu style={{ width: ICON_SIZE, height: ICON_SIZE }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ my: 0.25, borderBottomWidth: 0.5 }} />
        </>
      )}

      {/* Navegação */}
      <List sx={{ flex: 1, py: 0, px: 0.75, minHeight: 0 }} dense>
        {navCategories.map((category) => (
          <Box key={category.label}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 1.25,
                  py: 0.375,
                  display: "block",
                  color: "text.secondary",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {category.label}
              </Typography>
            )}
            {category.items.map((item) => {
              const isActive = location.pathname === item.path;
              const icon = <item.icon style={{ width: ICON_SIZE, height: ICON_SIZE }} />;
              return (
                <Tooltip key={item.path} title={collapsed ? item.title : ""} placement="right">
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleNav(item.path)}
                    sx={{
                      position: "relative",
                      borderRadius: 1,
                      mb: 0.125,
                      py: 0.5,
                      minHeight: 36,
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 1 : 1.25,
                      "&:hover": { bgcolor: "rgba(37, 99, 235, 0.1)" },
                      "&.Mui-selected": {
                        backgroundColor: "rgba(37, 99, 235, 0.14)",
                        color: SIDEBAR_ACCENT,
                        opacity: 1,
                        "&:hover": {
                          backgroundColor: "rgba(37, 99, 235, 0.2)",
                          color: SIDEBAR_ACCENT,
                          opacity: 1,
                        },
                        "& .MuiListItemIcon-root": { color: SIDEBAR_ACCENT, opacity: 1 },
                        "& .MuiListItemText-primary": { color: SIDEBAR_ACCENT, opacity: 1 },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? "auto" : 32,
                        color: "inherit",
                        "& .MuiSvgIcon-root": { fontSize: ICON_SIZE },
                      }}
                    >
                      {icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          variant: "body2",
                          sx: { fontSize: "0.8125rem" },
                        }}
                      />
                    )}
                    {isActive && !collapsed && (
                      <Box
                        className="sidebar-dot"
                        sx={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "#fff",
                          boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </List>

      <Divider sx={{ my: 0.25, borderBottomWidth: 0.5 }} />

      <List sx={{ py: 0, px: 0.75 }} dense disablePadding>
        <Tooltip title={theme === "light" ? "Alternar para escuro" : "Alternar para claro"} placement="right">
          <ListItemButton
            onClick={toggleTheme}
            sx={{
              borderRadius: 1,
              py: 0.375,
              minHeight: 32,
              justifyContent: collapsed ? "center" : "flex-start",
              px: collapsed ? 1 : 1.25,
              "&:hover": { bgcolor: "rgba(37, 99, 235, 0.1)" },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? "auto" : 28,
                "& .MuiSvgIcon-root": { fontSize: ICON_SIZE },
              }}
            >
              {theme === "light" ? (
                <Moon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
              ) : (
                <Sun style={{ width: ICON_SIZE, height: ICON_SIZE }} />
              )}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={theme === "light" ? "Escuro" : "Claro"}
                primaryTypographyProps={{ sx: { fontSize: "0.75rem" } }}
              />
            )}
          </ListItemButton>
        </Tooltip>
        <Tooltip title="Ajuda" placement="right">
          <ListItemButton
            onClick={() => handleNav("/base-conhecimento")}
            sx={{
              borderRadius: 1,
              py: 0.375,
              minHeight: 32,
              justifyContent: collapsed ? "center" : "flex-start",
              px: collapsed ? 1 : 1.25,
              "&:hover": { bgcolor: "rgba(37, 99, 235, 0.1)" },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? "auto" : 28,
                "& .MuiSvgIcon-root": { fontSize: ICON_SIZE },
              }}
            >
              <HelpCircle style={{ width: ICON_SIZE, height: ICON_SIZE }} />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Ajuda"
                primaryTypographyProps={{ sx: { fontSize: "0.75rem" } }}
              />
            )}
          </ListItemButton>
        </Tooltip>
        <UserNav collapsed={collapsed} />
      </List>
    </Box>
  );
}
