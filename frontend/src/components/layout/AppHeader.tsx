import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Menu as MenuIcon, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificationService";
import { formatDate } from "@/lib/utils";

/** Altura alinhada à linha do primeiro divider da sidebar (59px). */
export const APP_HEADER_HEIGHT = 59;

interface AppHeaderProps {
  onMobileToggle?: () => void;
}

export function AppHeader({ onMobileToggle }: AppHeaderProps) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<{ id: string; titulo?: string; mensagem?: string; created_at: string; lida: boolean }[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = () => {
      notificationService.list().then((r) => {
        if (r.success) {
          setUnreadCount(r.unreadCount ?? 0);
          setNotifications(r.notifications ?? []);
        }
      }).catch(() => {});
    };
    load();
    const t = setInterval(load, 60 * 1000);
    return () => clearInterval(t);
  }, [isAuthenticated]);

  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleMarkAllRead = () => {
    notificationService.markAllRead().then(() => {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    });
  };

  return (
    <Box
      component="header"
      sx={{
        height: APP_HEADER_HEIGHT,
        minHeight: APP_HEADER_HEIGHT,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 1.5, md: 3 },
        gap: 1,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={onMobileToggle}
          aria-label="Abrir menu"
          sx={{
            display: { xs: "inline-flex", md: "none" },
            color: "text.secondary",
          }}
          size="small"
        >
          <MenuIcon style={{ width: 20, height: 20 }} />
        </IconButton>
      </Box>
      {isAuthenticated && (
        <>
          <IconButton onClick={handleOpen} aria-label="Notificações" size="small" color="inherit">
            <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="primary">
              <Bell style={{ width: 20, height: 20 }} />
            </Badge>
          </IconButton>
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box sx={{ width: 320, maxHeight: 400 }}>
              <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="subtitle2">Notificações</Typography>
                {unreadCount > 0 && (
                  <Button size="small" onClick={handleMarkAllRead}>Marcar todas como lidas</Button>
                )}
              </Box>
              <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
                {notifications.length === 0 ? (
                  <ListItemButton disabled>
                    <ListItemText primary="Nenhuma notificação" secondary="Você será avisado de novas respostas e atualizações." />
                  </ListItemButton>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <ListItemButton key={n.id}>
                      <ListItemText
                        primary={n.titulo || "Atualização"}
                        secondary={
                          <>
                            {n.mensagem && <Typography variant="caption" display="block">{n.mensagem}</Typography>}
                            <Typography variant="caption" color="text.secondary">{formatDate(n.created_at)}</Typography>
                          </>
                        }
                        primaryTypographyProps={{ fontWeight: n.lida ? 400 : 600 }}
                      />
                    </ListItemButton>
                  ))
                )}
              </List>
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
}
