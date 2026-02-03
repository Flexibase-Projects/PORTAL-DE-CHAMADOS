import React from 'react';
import { Box } from '@mui/material';

const Layout = ({ children }) => {
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
};

export default Layout;
