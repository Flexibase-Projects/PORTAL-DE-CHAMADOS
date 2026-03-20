import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Send,
  Inbox,
  Moon,
  Sun,
  TicketCheck,
  ChevronLeft,
  Menu,
  FileEdit,
  Users,
  CalendarDays,
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
import { useTheme as useMuiTheme, alpha } from "@mui/material/styles";
import { useTheme } from "@/hooks/useTheme";
import { UserNav } from "./UserNav";
import { APP_HEADER_HEIGHT } from "./AppHeader";

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
      { title: "Calendário", icon: CalendarDays, path: "/admin/calendario" },
      { title: "Templates", icon: FileEdit, path: "/admin/templates" },
      { title: "Usuários", icon: Users, path: "/admin/usuarios" },
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
/** Título e hierarquia — bom contraste em #F0F8FF */
const SHELL_TITLE = "#1e3a5f";
const SHELL_SECTION_MUTED = "#6b7c93";
const ICON_SIZE = 18;
const LOGO_SIZE = 28;

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  isMobile,
  onNavigate,
  onHeaderClick,
}: AppSidebarProps) {
  const muiTheme = useMuiTheme();
  const isLight = muiTheme.palette.mode === "light";
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isTiUser } = useAuth();

  const navHoverBg = isLight ? alpha(muiTheme.palette.secondary.main, 0.14) : alpha(muiTheme.palette.primary.main, 0.12);
  const navSelectedBg = isLight ? alpha(muiTheme.palette.primary.main, 0.12) : alpha(muiTheme.palette.primary.main, 0.22);
  const navSelectedHoverBg = isLight ? alpha(muiTheme.palette.primary.main, 0.18) : alpha(muiTheme.palette.primary.main, 0.28);

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
        pt: 0,
        pb: 0.75,
        minHeight: 0,
      }}
    >
      {/* Área logo + divider: altura fixa igual ao header para o divider alinhar à linha do header */}
      <Box
        sx={{
          height: APP_HEADER_HEIGHT,
          minHeight: APP_HEADER_HEIGHT,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {!collapsed && (
          <>
            <Box
              sx={{
                flex: 1,
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
                  borderRadius: 1.25,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: isLight ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                  ...(isLight
                    ? {
                        background: "linear-gradient(145deg, #1d4ed8 0%, #0e7490 52%, #0891b2 100%)",
                      }
                    : { bgcolor: SIDEBAR_ACCENT }),
                }}
                aria-hidden
              >
                <TicketCheck style={{ width: 16, height: 16 }} />
              </Box>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: "0.8125rem",
                  color: isLight ? SHELL_TITLE : "text.primary",
                  letterSpacing: "-0.01em",
                }}
              >
                Portal de Chamados
              </Typography>
              <Tooltip title={toggleLabel} placement="right">
                <IconButton
                  size="small"
                  onClick={handleToggle}
                  aria-label={toggleLabel}
                  sx={{
                    color: isLight ? alpha(SHELL_TITLE, 0.65) : "text.secondary",
                    "&:hover": {
                      bgcolor: navHoverBg,
                      color: isLight ? SHELL_TITLE : "text.primary",
                    },
                  }}
                >
                  <ToggleIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider
              sx={{
                flexShrink: 0,
                borderBottomWidth: 0.5,
                borderColor: isLight ? alpha(muiTheme.palette.primary.main, 0.1) : undefined,
              }}
            />
          </>
        )}

        {collapsed && (
          <>
            <Box
              sx={{
                flex: 1,
                px: 0,
                py: 1.25,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
              }}
            >
              <Box
                sx={{
                  width: LOGO_SIZE,
                  height: LOGO_SIZE,
                  borderRadius: 1.25,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: isLight ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                  ...(isLight
                    ? {
                        background: "linear-gradient(145deg, #1d4ed8 0%, #0e7490 52%, #0891b2 100%)",
                      }
                    : { bgcolor: SIDEBAR_ACCENT }),
                }}
                aria-hidden
              >
                <TicketCheck style={{ width: 16, height: 16 }} />
              </Box>
            </Box>
            <Divider
              sx={{
                flexShrink: 0,
                borderBottomWidth: 0.5,
                borderColor: isLight ? alpha(muiTheme.palette.primary.main, 0.1) : undefined,
              }}
            />
          </>
        )}
      </Box>

      {/* Botão expandir (só no modo retraído) */}
      {collapsed && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
          <Tooltip title={toggleLabel} placement="right">
            <IconButton
              size="small"
              onClick={handleToggle}
              aria-label={toggleLabel}
              sx={{
                color: isLight ? alpha(SHELL_TITLE, 0.65) : "text.secondary",
                "&:hover": {
                  bgcolor: navHoverBg,
                  color: isLight ? SHELL_TITLE : "text.primary",
                },
              }}
            >
              <Menu style={{ width: ICON_SIZE, height: ICON_SIZE }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {collapsed && (
        <Divider
          sx={{
            my: 0.25,
            borderBottomWidth: 0.5,
            borderColor: isLight ? alpha(muiTheme.palette.primary.main, 0.1) : undefined,
          }}
        />
      )}

      {/* Navegação */}
      <List sx={{ flex: 1, py: 0, px: 0.75, minHeight: 0 }} dense>
        {navCategories.map((category) => {
          const items = category.items.filter(
            (item) => item.path !== "/admin/usuarios" || isTiUser
          );
          if (items.length === 0) return null;
          return (
          <Box key={category.label}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 1.25,
                  py: 0.375,
                  display: "block",
                  color: isLight ? SHELL_SECTION_MUTED : "text.secondary",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {category.label}
              </Typography>
            )}
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              const icon = <item.icon style={{ width: ICON_SIZE, height: ICON_SIZE }} />;
              return (
                <Tooltip key={item.path} title={collapsed ? item.title : ""} placement="right">
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleNav(item.path)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.75,
                      py: 0.5,
                      minHeight: 36,
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 1 : 1.25,
                      color: isLight ? alpha(SHELL_TITLE, 0.92) : "text.primary",
                      "&:hover": { bgcolor: navHoverBg },
                      "& .MuiListItemIcon-root": {
                        color: isLight ? alpha(SHELL_TITLE, 0.72) : "inherit",
                      },
                      "&.Mui-selected": {
                        backgroundColor: navSelectedBg,
                        color: SIDEBAR_ACCENT,
                        opacity: 1,
                        "&:hover": {
                          backgroundColor: navSelectedHoverBg,
                          color: SIDEBAR_ACCENT,
                          opacity: 1,
                        },
                        "& .MuiListItemIcon-root": { color: SIDEBAR_ACCENT, opacity: 1 },
                        "& .MuiListItemText-primary": { color: SIDEBAR_ACCENT, opacity: 1, fontWeight: 600 },
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
                          sx: { fontSize: "0.8125rem", color: "inherit" },
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </Box>
          );
        })}
      </List>

      <Divider
        sx={{
          my: 0.25,
          borderBottomWidth: 0.5,
          borderColor: isLight ? alpha(muiTheme.palette.primary.main, 0.1) : undefined,
        }}
      />

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
              color: isLight ? alpha(SHELL_TITLE, 0.85) : "text.secondary",
              "&:hover": { bgcolor: navHoverBg, color: isLight ? SHELL_TITLE : "text.primary" },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? "auto" : 28,
                color: "inherit",
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
                primaryTypographyProps={{ sx: { fontSize: "0.75rem", color: "inherit" } }}
              />
            )}
          </ListItemButton>
        </Tooltip>
        <UserNav collapsed={collapsed} />
      </List>
    </Box>
  );
}
