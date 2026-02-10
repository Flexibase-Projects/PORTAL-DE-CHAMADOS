import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { useAuth } from "@/contexts/AuthContext";

const ICON_SIZE = 16;

interface UserNavProps {
  collapsed?: boolean;
}

export function UserNav({ collapsed }: UserNavProps) {
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
          "&:hover": { bgcolor: "rgba(37, 99, 235, 0.1)" },
        }}
        aria-label="Sair"
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : 28,
            "& .MuiSvgIcon-root": { fontSize: ICON_SIZE },
          }}
        >
          <LogOut style={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary="Sair"
            primaryTypographyProps={{ sx: { fontSize: "0.75rem" } }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );
}
