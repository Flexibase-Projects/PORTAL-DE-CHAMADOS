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
  ChevronRight,
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
    label: "INÍCIO",
    items: [{ title: "Dashboard", icon: LayoutDashboard, path: "/" }],
  },
  {
    label: "CHAMADOS",
    items: [
      { title: "Enviar Chamado", icon: Send, path: "/criar-chamado" },
      { title: "Meus Chamados", icon: Inbox, path: "/meus-chamados" },
    ],
  },
  {
    label: "ADMINISTRAÇÃO",
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

const BRAND_BLUE = "#2563eb";
const ACTIVE_PILL_BG_LIGHT = "#dbeafe";
const ACTIVE_PILL_HOVER_BG_LIGHT = "#bfdbfe";
/** Título da marca (PDC) */
const BRAND_TITLE = "#1e293b";
/** Itens inativos — cinza-azulado */
const NAV_IDLE_LIGHT = "#475569";
/** Rótulos de seção (estilo SCV) */
const SECTION_MUTED_LIGHT = "#94a3b8";
const ICON_SIZE = 20;
const LOGO_BOX = 40;
const LOGO_ICON = 22;

function pathIsActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/") return pathname === "/";
  if (pathname === itemPath) return true;
  return pathname.startsWith(`${itemPath}/`);
}

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

  const navHoverBg = isLight ? ACTIVE_PILL_BG_LIGHT : alpha(muiTheme.palette.primary.main, 0.1);
  const navSelectedBg = isLight ? ACTIVE_PILL_BG_LIGHT : alpha(muiTheme.palette.primary.main, 0.2);
  const navSelectedHoverBg = isLight ? ACTIVE_PILL_HOVER_BG_LIGHT : alpha(muiTheme.palette.primary.main, 0.28);
  const sectionMuted = isLight ? SECTION_MUTED_LIGHT : muiTheme.palette.text.secondary;
  const navIdleColor = isLight ? NAV_IDLE_LIGHT : muiTheme.palette.text.secondary;
  const activeNavColor = isLight ? BRAND_BLUE : muiTheme.palette.primary.light;
  const selectedGlow = isLight ? alpha(BRAND_BLUE, 0.1) : alpha(BRAND_BLUE, 0.14);
  const selectedItemShadow = isLight
    ? `0 2px 8px rgba(37, 99, 235, 0.18), 0 1px 3px rgba(15, 23, 42, 0.07), 0 0 0 1px rgba(37, 99, 235, 0.06), 0 0 20px ${selectedGlow}`
    : `0 2px 10px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 26px ${selectedGlow}`;

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
  /** Expandido / mobile: fecha ou retrai (seta para a esquerda). Retraído no desktop: expande (seta para a direita). */
  const ToggleIcon = isMobile || !collapsed ? ChevronLeft : ChevronRight;

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
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  width: LOGO_BOX,
                  height: LOGO_BOX,
                  borderRadius: 2,
                  bgcolor: BRAND_BLUE,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: isLight ? "0 2px 10px rgba(37, 99, 235, 0.28)" : "0 1px 4px rgba(0,0,0,0.35)",
                }}
                aria-hidden
              >
                <TicketCheck style={{ width: LOGO_ICON, height: LOGO_ICON }} strokeWidth={2} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component="div"
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    lineHeight: 1.2,
                    color: isLight ? BRAND_TITLE : "text.primary",
                    letterSpacing: "-0.02em",
                  }}
                >
                  PDC
                </Typography>
                <Typography
                  component="div"
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.25,
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    lineHeight: 1.25,
                  }}
                >
                  Portal de Chamados
                </Typography>
              </Box>
              <Tooltip title={toggleLabel} placement="right">
                <IconButton
                  size="small"
                  onClick={handleToggle}
                  aria-label={toggleLabel}
                  sx={{
                    color: isLight ? alpha(BRAND_TITLE, 0.45) : alpha(muiTheme.palette.common.white, 0.5),
                    "&:hover": {
                      bgcolor: navHoverBg,
                      color: isLight ? BRAND_TITLE : "text.primary",
                    },
                  }}
                >
                  <ToggleIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} strokeWidth={2} />
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
                py: 1.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
              }}
            >
              <Box
                sx={{
                  width: LOGO_BOX - 4,
                  height: LOGO_BOX - 4,
                  borderRadius: 2,
                  bgcolor: BRAND_BLUE,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: isLight ? "0 2px 10px rgba(37, 99, 235, 0.28)" : "0 1px 4px rgba(0,0,0,0.35)",
                }}
                aria-hidden
              >
                <TicketCheck style={{ width: LOGO_ICON - 2, height: LOGO_ICON - 2 }} strokeWidth={2} />
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

      {collapsed && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
          <Tooltip title={toggleLabel} placement="right">
            <IconButton
              size="small"
              onClick={handleToggle}
              aria-label={toggleLabel}
              sx={{
                color: isLight ? alpha(BRAND_TITLE, 0.45) : "text.secondary",
                "&:hover": {
                  bgcolor: navHoverBg,
                  color: isLight ? BRAND_TITLE : "text.primary",
                },
              }}
            >
              <ChevronRight style={{ width: ICON_SIZE, height: ICON_SIZE }} strokeWidth={2} />
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

      {/* Navegação (estilo SCV: seções em caps, item ativo em pill + ponto) */}
      <List sx={{ flex: 1, py: 0.5, px: 1.5, minHeight: 0 }} dense>
        {navCategories.map((category, catIndex) => {
          const items = category.items.filter(
            (item) => item.path !== "/admin/usuarios" || isTiUser
          );
          if (items.length === 0) return null;
          return (
            <Box key={category.label}>
              {!collapsed && (
                <Typography
                  variant="caption"
                  component="div"
                  sx={{
                    px: 0.75,
                    pt: catIndex === 0 ? 1 : 2.25,
                    pb: 1,
                    display: "block",
                    color: sectionMuted,
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                  }}
                >
                  {category.label}
                </Typography>
              )}
              {items.map((item) => {
                const isActive = pathIsActive(location.pathname, item.path);
                const icon = <item.icon style={{ width: ICON_SIZE, height: ICON_SIZE }} strokeWidth={1.75} />;
                return (
                  <Tooltip key={item.path} title={collapsed ? item.title : ""} placement="right">
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleNav(item.path)}
                      sx={{
                        borderRadius: 3,
                        mb: 0.5,
                        py: 1,
                        minHeight: 44,
                        justifyContent: collapsed ? "center" : "flex-start",
                        px: collapsed ? 1 : 1.25,
                        color: navIdleColor,
                        transform: "translateX(0) scale(1)",
                        transition: (t) =>
                          t.transitions.create(["background-color", "box-shadow", "color", "transform"], {
                            duration: 280,
                            easing: t.transitions.easing.easeOut,
                          }),
                        "@media (prefers-reduced-motion: reduce)": {
                          transition: (t) =>
                            t.transitions.create(["background-color", "color"], {
                              duration: 160,
                              easing: t.transitions.easing.easeInOut,
                            }),
                        },
                        "&:hover": {
                          bgcolor: navHoverBg,
                          color: isLight ? BRAND_TITLE : "text.primary",
                        },
                        "& .MuiListItemIcon-root": {
                          color: "inherit",
                          minWidth: collapsed ? "auto" : 40,
                        },
                        "&.Mui-selected": {
                          backgroundColor: `${navSelectedBg} !important`,
                          color: `${activeNavColor} !important`,
                          boxShadow: selectedItemShadow,
                          transition: (t) =>
                            t.transitions.create(["background-color", "box-shadow", "color", "transform"], {
                              duration: 320,
                              easing: t.transitions.easing.easeOut,
                            }),
                          transform: collapsed ? "scale(1.05)" : "translateX(3px)",
                          "@media (prefers-reduced-motion: reduce)": {
                            transform: "none",
                            transition: (t) =>
                              t.transitions.create(["background-color", "color"], {
                                duration: 160,
                                easing: t.transitions.easing.easeInOut,
                              }),
                          },
                          "&:hover": {
                            backgroundColor: `${navSelectedHoverBg} !important`,
                            color: `${activeNavColor} !important`,
                            boxShadow: selectedItemShadow,
                          },
                          "& .MuiListItemIcon-root": { color: `${activeNavColor} !important` },
                          "& .MuiListItemText-primary": {
                            color: `${activeNavColor} !important`,
                            fontWeight: 600,
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: "inherit" }}>{icon}</ListItemIcon>
                      {!collapsed && (
                        <>
                          <ListItemText
                            primary={item.title}
                            primaryTypographyProps={{
                              variant: "body2",
                              sx: {
                                fontSize: "0.875rem",
                                fontWeight: isActive ? 600 : 500,
                                color: "inherit",
                              },
                            }}
                            sx={{ flex: "1 1 auto", minWidth: 0, my: 0 }}
                          />
                          {isActive && (
                            <Box
                              component="span"
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: activeNavColor,
                                flexShrink: 0,
                                ml: 0.5,
                              }}
                              aria-hidden
                            />
                          )}
                        </>
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

      <List sx={{ py: 0.5, px: 1.5, pb: 1 }} dense disablePadding>
        <Tooltip title={theme === "light" ? "Alternar para modo escuro" : "Alternar para modo claro"} placement="right">
          <ListItemButton
            onClick={toggleTheme}
            sx={{
              borderRadius: 3,
              py: 1,
              minHeight: 44,
              justifyContent: collapsed ? "center" : "flex-start",
              px: collapsed ? 1 : 1.25,
              color: navIdleColor,
              "&:hover": {
                bgcolor: navHoverBg,
                color: isLight ? BRAND_TITLE : "text.primary",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? "auto" : 40,
                color: "inherit",
              }}
            >
              {theme === "light" ? (
                <Moon style={{ width: ICON_SIZE, height: ICON_SIZE }} strokeWidth={1.75} />
              ) : (
                <Sun style={{ width: ICON_SIZE, height: ICON_SIZE }} strokeWidth={1.75} />
              )}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={theme === "light" ? "Modo escuro" : "Modo claro"}
                primaryTypographyProps={{ sx: { fontSize: "0.875rem", fontWeight: 500, color: "inherit" } }}
              />
            )}
          </ListItemButton>
        </Tooltip>
        <UserNav collapsed={collapsed} />
      </List>
    </Box>
  );
}
