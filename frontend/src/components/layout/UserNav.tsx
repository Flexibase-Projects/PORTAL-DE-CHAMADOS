import { useState } from "react";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

interface UserNavProps {
  collapsed?: boolean;
  /** Cor do avatar (ex.: #7289da para combinar com a sidebar). */
  sidebarAccent?: string;
}

export function UserNav({ collapsed, sidebarAccent = "#7289da" }: UserNavProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const user = {
    nome: "Administrador",
    email: "admin@portal.com",
    role: "Administrador",
  };

  const initials = user.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          borderRadius: 1,
          justifyContent: collapsed ? "center" : "flex-start",
          px: 1.5,
          py: 1.5,
          color: "inherit",
        }}
        aria-controls={open ? "user-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: sidebarAccent,
            color: "#fff",
            fontSize: "0.75rem",
          }}
        >
          {initials}
        </Avatar>
        {!collapsed && (
          <Box sx={{ flex: 1, minWidth: 0, ml: 1.5, textAlign: "left" }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: "inherit" }}>
              {user.nome}
            </Typography>
            <Typography variant="caption" noWrap display="block" color="text.secondary">
              {user.role}
            </Typography>
          </Box>
        )}
        {!collapsed && (
          <ChevronsUpDown style={{ width: 16, height: 16, marginLeft: 4 }} />
        )}
      </ListItemButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight={600}>
            {user.nome}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuList dense disablePadding>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <User style={{ width: 18, height: 18 }} />
            </ListItemIcon>
            <ListItemText>Perfil</ListItemText>
          </MenuItem>
        </MenuList>
        <Divider />
        <MenuList dense disablePadding>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <LogOut style={{ width: 18, height: 18 }} />
            </ListItemIcon>
            <ListItemText>Sair</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}
