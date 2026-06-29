import { createBrowserRouter, createHashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Coach } from './pages/Coach';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Report } from './pages/Report';
import { More } from './pages/More';
import { Import } from './pages/Import';
import { modules } from './core/registry';

/**
 * The router is assembled from the registry: the shell + core pages, plus each
 * module's own routes mounted under /m/:id. Modules own everything below their
 * base path (including their index screen), so a new module brings its screens
 * without editing this file — only registry.ts changes.
 */
// A single self-contained build (opened from file://) needs hash-based routing,
// since the History API can't push real paths without a server. The standalone
// build sets VITE_STANDALONE; everything else uses normal browser routing.
const createRouter = import.meta.env.VITE_STANDALONE
  ? createHashRouter
  : createBrowserRouter;

export const router = createRouter(
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
        { path: 'more', element: <More /> },
        { path: 'import', element: <Import /> },
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
