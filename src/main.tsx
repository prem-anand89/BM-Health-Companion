import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './App';
import { initDb } from './core/registry';
import { applyStoredPreferences } from './core/preferences';
import './index.css';

// Apply saved display preferences (large text / high contrast) before paint.
applyStoredPreferences();

// Initialise the database (registers every module's schema) before render so
// reactive queries have a ready Dexie instance.
initDb();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
