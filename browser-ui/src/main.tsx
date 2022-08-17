import { MantineProvider } from '@mantine/core'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import * as api from './client/api';

api.setup();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider withGlobalStyles>
      <App />
    </MantineProvider>
  </React.StrictMode>
)
