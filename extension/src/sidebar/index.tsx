// Sidebar React application

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { SidebarApp } from './components/SidebarApp';
import { GlobalStyles } from '../popup/styles/GlobalStyles';
import { theme } from '../popup/styles/theme';

// Initialize sidebar
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <SidebarApp />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error('Root container not found');
}
