import { MantineProvider } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as api from './client/api';
import './index.css';

api.setup();



ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider withGlobalStyles>
      <NotificationsProvider position='top-center'>
        <App />
      </NotificationsProvider>
    </MantineProvider>
  </React.StrictMode>
)
