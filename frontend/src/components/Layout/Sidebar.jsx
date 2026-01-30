import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
  AdminPanelSettings as AdminIcon,
  MenuBook as KnowledgeIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  { text: 'Página Inicial', icon: <HomeIcon />, path: '/' },
  { text: 'Enviar Chamado', icon: <SendIcon />, path: '/criar-chamado' },
  { text: 'Meus Chamados', icon: <InboxIcon />, path: '/meus-chamados' },
  { text: 'Painel Administrativo', icon: <AdminIcon />, path: '/painel-administrativo' },
  { text: 'Base de Conhecimento', icon: <KnowledgeIcon />, path: '/base-conhecimento' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Portal de Chamados
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
