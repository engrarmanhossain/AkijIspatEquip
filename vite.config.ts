import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function sharedStoragePlugin(): Plugin {
  const handler = (req: any, res: any, next: any) => {
    if (!req.url) return next();
    const url = req.url.split('?')[0];

    if (url === '/api/sync') {
      const filePath = path.resolve(process.cwd(), 'public/shared_data.json');

      if (req.method === 'GET') {
        try {
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.statusCode = 200;
            res.end(content);
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({}));
          return;
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}');
            let existing: Record<string, any> = {};
            if (fs.existsSync(filePath)) {
              try {
                existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              } catch {
                existing = {};
              }
            }

            const merged = {
              ...existing,
              ...incoming,
              lastSyncedAt: new Date().toISOString(),
            };

            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, lastSyncedAt: merged.lastSyncedAt }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }
    }

    next();
  };

  return {
    name: 'shared-storage-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sharedStoragePlugin(),
  ],
})
