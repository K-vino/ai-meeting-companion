// Popup React application

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { PopupApp } from './components/PopupApp';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';

// Initialize popup
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <PopupApp />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error('Root container not found');
}
