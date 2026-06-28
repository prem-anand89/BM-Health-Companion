import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Coach } from './pages/Coach';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Report } from './pages/Report';
import { modules } from './core/registry';

/**
 * The router is assembled from the registry: the shell + core pages, plus each
 * module's own routes mounted under /m/:id. Modules own everything below their
 * base path (including their index screen), so a new module brings its screens
 * without editing this file — only registry.ts changes.
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'coach', element: <Coach /> },
        { path: 'settings', element: <Settings /> },
        { path: 'history', element: <History /> },
        { path: 'report', element: <Report /> },
        ...modules.map((m) => ({
          path: `m/${m.id}`,
          children: m.routes,
        })),
      ],
    },
  ],
  // Honour the Vite base path so routing works under a GitHub Pages subpath.
  { basename: import.meta.env.BASE_URL },
);
