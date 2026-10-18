import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.vtt': 'text/vtt; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const ENTRY_FILES = new Set(['index.html', 'lab.html', 'lab.js', 'workshop-model.mjs', 'workshop-ui.mjs', 'workshop-motion.mjs', 'lab.css', 'slides.css', 'slides.js', 'demo.css', 'demo.js', 'github-onboarding.md']);

// The practice runs entirely in the browser; this server only serves public assets.
export function createLabServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    const reject = (status, message) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : message);
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) return reject(404, 'API를 제공하지 않습니다.');
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.setHeader('Allow', 'GET, HEAD');
        return reject(405, '지원하지 않는 요청입니다.');
      }
      let relative;
      try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'; }
      catch { return reject(400, '올바르지 않은 경로입니다.'); }
      const full = path.resolve(ROOT, relative);
      if ((!ENTRY_FILES.has(relative) && !relative.startsWith('assets/')) || !full.startsWith(ROOT + path.sep) || relative.split('/').some(p => p.startsWith('.'))) return reject(404, '파일을 찾을 수 없습니다.');
      const info = await stat(full).catch(() => null);
      if (!info?.isFile()) return reject(404, '파일을 찾을 수 없습니다.');
      const content = req.method === 'HEAD' ? undefined : await readFile(full);
      // A stopped preview must not leave an old HTML shell paired with missing modules.
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': ENTRY_FILES.has(relative) ? 'no-store' : 'no-cache' });
      res.end(content);
    } catch {
      if (!res.headersSent) reject(500, '파일을 읽지 못했습니다.');
      else res.end();
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createLabServer();
  server.listen(Number(process.env.PORT || 4173), process.env.HOST || '127.0.0.1', () => {
    console.log(`GitHub 협업 실습실: http://localhost:${server.address().port}/lab.html`);
  });
  const shutdown = () => server.close();
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
}
