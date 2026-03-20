import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { useTheme, alpha } from "@mui/material/styles";
import { useAuth } from "@/contexts/AuthContext";

const SHELL_TITLE = "#1e3a5f";

const ICON_SIZE = 16;

interface UserNavProps {
  collapsed?: boolean;
}

export function UserNav({ collapsed }: UserNavProps) {
  const muiTheme = useTheme();
  const isLight = muiTheme.palette.mode === "light";
  const navHoverBg = isLight ? alpha(muiTheme.palette.secondary.main, 0.14) : alpha(muiTheme.palette.primary.main, 0.12);
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
          borderRadius: 1,
          py: 0.375,
          minHeight: 32,
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 1 : 1.25,
          color: isLight ? alpha(SHELL_TITLE, 0.75) : "text.secondary",
          "&:hover": {
            bgcolor: navHoverBg,
            color: isLight ? alpha("#b91c1c", 0.95) : muiTheme.palette.error.light,
          },
        }}
        aria-label="Sair"
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : 28,
            color: "inherit",
            "& .MuiSvgIcon-root": { fontSize: ICON_SIZE },
          }}
        >
          <LogOut style={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary="Sair"
            primaryTypographyProps={{ sx: { fontSize: "0.75rem", color: "inherit" } }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );
}
