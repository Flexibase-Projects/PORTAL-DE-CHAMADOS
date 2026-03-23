import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { useTheme, alpha } from "@mui/material/styles";
import { useAuth } from "@/contexts/AuthContext";

const NAV_IDLE_LIGHT = "#475569";

const ICON_SIZE = 20;

interface UserNavProps {
  collapsed?: boolean;
}

export function UserNav({ collapsed }: UserNavProps) {
  const muiTheme = useTheme();
  const isLight = muiTheme.palette.mode === "light";
  const navHoverBg = isLight ? alpha("#2563eb", 0.06) : alpha(muiTheme.palette.primary.main, 0.1);
  const navIdleColor = isLight ? NAV_IDLE_LIGHT : muiTheme.palette.text.secondary;
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSair = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Tooltip title="Sair" placement="right">
      <ListItemButton
        onClick={handleSair}
        sx={{
          borderRadius: 3,
          py: 1,
          minHeight: 44,
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 1 : 1.25,
          color: navIdleColor,
          "&:hover": {
            bgcolor: navHoverBg,
            color: isLight ? alpha("#b91c1c", 0.95) : muiTheme.palette.error.light,
          },
        }}
        aria-label="Sair"
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : 40,
            color: "inherit",
          }}
        >
          <LogOut style={{ width: ICON_SIZE, height: ICON_SIZE }} strokeWidth={1.75} />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary="Sair"
            primaryTypographyProps={{ sx: { fontSize: "0.875rem", fontWeight: 500, color: "inherit" } }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );
}
