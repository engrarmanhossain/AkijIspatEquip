import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

let gitPushTimeout: any = null;

function triggerAutoGitPush() {
  if (gitPushTimeout) {
    clearTimeout(gitPushTimeout);
  }
  gitPushTimeout = setTimeout(() => {
    // Automatically stage shared data files, commit and push to origin main
    exec(
      'git add public/shared_data.json dist/shared_data.json && git commit -m "chore: auto-sync equipment telemetry, profile photo & company details" && git push origin main',
      (err, stdout) => {
        if (err) {
          console.warn('[AutoGitPush] Skipped or failed:', err.message);
        } else {
          console.log('[AutoGitPush] Successfully pushed to origin main:', stdout.trim() || 'OK');
        }
      }
    );
  }, 1200);
}

function sharedStoragePlugin(): Plugin {
  const handler = (req: any, res: any, next: any) => {
    if (!req.url) return next();
    const cleanUrl = req.url.split('?')[0];

    if (cleanUrl.endsWith('/api/sync') || cleanUrl.includes('/api/sync')) {
      const publicFilePath = path.resolve(process.cwd(), 'public/shared_data.json');
      const distFilePath = path.resolve(process.cwd(), 'dist/shared_data.json');

      if (req.method === 'GET') {
        try {
          if (fs.existsSync(publicFilePath)) {
            const content = fs.readFileSync(publicFilePath, 'utf-8');
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
            if (fs.existsSync(publicFilePath)) {
              try {
                existing = JSON.parse(fs.readFileSync(publicFilePath, 'utf-8'));
              } catch {
                existing = {};
              }
            }

            // Smart merge for companySettings (Never overwrite existing logo with empty unless explicitly requested)
            const mergedCompanySettings = {
              ...(existing.companySettings || {}),
              ...(incoming.companySettings || {}),
            };
            if (!incoming.companySettings?.logoUrl && existing.companySettings?.logoUrl) {
              mergedCompanySettings.logoUrl = existing.companySettings.logoUrl;
            }

            // Smart merge for employees (Preserve avatarUrl if incoming didn't supply one)
            let mergedEmployees = existing.employees || [];
            if (incoming.employees && Array.isArray(incoming.employees)) {
              const incomingMap = new Map(incoming.employees.map((e: any) => [e.id, e]));
              const existingMap = new Map((existing.employees || []).map((e: any) => [e.id, e]));

              const allIds = new Set([...existingMap.keys(), ...incomingMap.keys()]);
              mergedEmployees = Array.from(allIds).map((id) => {
                const ex = existingMap.get(id);
                const inc = incomingMap.get(id);
                if (ex && inc) {
                  return {
                    ...ex,
                    ...inc,
                    avatarUrl: inc.avatarUrl !== undefined && inc.avatarUrl !== '' ? inc.avatarUrl : (ex.avatarUrl || ''),
                  };
                }
                return inc || ex;
              });
            }

            const merged = {
              ...existing,
              ...incoming,
              companySettings: mergedCompanySettings,
              employees: mergedEmployees,
              lastSyncedAt: new Date().toISOString(),
            };

            const publicDir = path.dirname(publicFilePath);
            if (!fs.existsSync(publicDir)) {
              fs.mkdirSync(publicDir, { recursive: true });
            }
            fs.writeFileSync(publicFilePath, JSON.stringify(merged, null, 2), 'utf-8');

            try {
              const distDir = path.dirname(distFilePath);
              if (fs.existsSync(distDir)) {
                fs.writeFileSync(distFilePath, JSON.stringify(merged, null, 2), 'utf-8');
              }
            } catch {
              // ignore
            }

            // Trigger automated push to GitHub
            triggerAutoGitPush();

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
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    sharedStoragePlugin(),
  ],
});
