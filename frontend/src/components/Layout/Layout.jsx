import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  if (isHome) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          p: 3,
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          ml: '280px',
          p: 3,
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
