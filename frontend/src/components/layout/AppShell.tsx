import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { clearDashboardStatsCache } from "@/services/ticketService";
import {
  startRealtimeStream,
  stopRealtimeStream,
  subscribeRealtime,
  type RealtimeEventPayload,
} from "@/services/realtimeClient";

const DRAWER_WIDTH = 252;
const DRAWER_WIDTH_COLLAPSED = 52;

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const width = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;
  const debounceRef = useRef<number | null>(null);
  const pendingTicketIdsRef = useRef<Set<string>>(new Set());

  const handleDrawerToggle = () => setMobileOpen((v) => !v);

  useEffect(() => {
    if (!user?.id) {
      stopRealtimeStream();
      return;
    }

    startRealtimeStream(user.id);
    const unsubscribe = subscribeRealtime((eventName, payload: RealtimeEventPayload) => {
      if (eventName === "connected") return;
      if (payload.ticketId) pendingTicketIdsRef.current.add(payload.ticketId);
      clearDashboardStatsCache();
      window.dispatchEvent(new CustomEvent("notifications-refresh"));
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        const ticketIds = [...pendingTicketIdsRef.current];
        pendingTicketIdsRef.current.clear();
        window.dispatchEvent(
          new CustomEvent("tickets-realtime-update", {
            detail: { ticketIds, source: "sse" },
          })
        );
      }, 350);
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      stopRealtimeStream();
    };
  }, [user?.id]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: width },
          flexShrink: { md: 0 },
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          <AppSidebar
            collapsed={false}
            onToggleCollapse={() => {}}
            isMobile
            onNavigate={handleDrawerToggle}
            onHeaderClick={handleDrawerToggle}
          />
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width,
              transition: (theme) =>
                theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              overflowX: "hidden",
            },
          }}
          open
        >
          <AppSidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            isMobile={false}
            onHeaderClick={() => setCollapsed((c) => !c)}
          />
        </Drawer>
      </Box>

      {/* Area principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          minWidth: 0,
          bgcolor: "background.default",
        }}
      >
        <AppHeader onMobileToggle={handleDrawerToggle} />
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: { xs: 1, sm: 1.5, md: 2, lg: 3 },
            bgcolor: "background.default",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
