import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4'
};

// ⚡ PERFORMANCE FIX #2: In-Memory File & Gzip Cache (0ms latency)
const fileCache = new Map();

function getCachedFile(filePath) {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }
  if (!fs.existsSync(filePath)) return null;

  const rawBuffer = fs.readFileSync(filePath);
  const etag = `"${crypto.createHash('md5').update(rawBuffer).digest('hex').substring(0, 16)}"`;
  const isCompressible = /\.(html|css|js|json|svg)$/i.test(filePath);
  const gzippedBuffer = isCompressible && rawBuffer.length > 512 ? zlib.gzipSync(rawBuffer) : null;

  const record = { rawBuffer, gzippedBuffer, etag };
  fileCache.set(filePath, record);
  return record;
}

const server = http.createServer((req, res) => {
  // Cloak server header
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  let reqPath = req.url.split('?')[0];
  let filePath = path.join(PUBLIC_DIR, reqPath === '/' ? 'index.html' : reqPath);

  // Security check: stay within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Handle dynamic funnel routes (e.g. /r/:slug -> funnel.html)
  if (reqPath.startsWith('/r/')) {
    filePath = path.join(PUBLIC_DIR, 'funnel.html');
  }

  // Handle clean URLs (e.g. /about -> /about.html or /admin -> /admin.html)
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  const file = getCachedFile(filePath);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // ⚡ PERFORMANCE FIX #1 & #5: ETag & Cache-Control validation
  const clientEtag = req.headers['if-none-match'];
  if (clientEtag && clientEtag === file.etag) {
    res.writeHead(304);
    res.end();
    return;
  }

  const isStaticAsset = /\.(css|js|webp|png|jpg|svg|mp4)$/i.test(ext);
  const cacheControl = isStaticAsset ? 'public, max-age=86400, stale-while-revalidate=604800' : 'public, max-age=0, must-revalidate';

  // ⚡ PERFORMANCE FIX #1: Gzip Compression negotiation
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (file.gzippedBuffer && acceptEncoding.includes('gzip')) {
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Encoding': 'gzip',
      'ETag': file.etag,
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding'
    });
    res.end(file.gzippedBuffer);
  } else {
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': file.rawBuffer.length,
      'ETag': file.etag,
      'Cache-Control': cacheControl
    });
    res.end(file.rawBuffer);
  }
});

server.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`⚡ ELITE AI AGENCY PLATFORM LIVE (GZIP & CACHED)`);
  console.log(`========================================================`);
  console.log(`🌐 Local URL:   http://localhost:${PORT}`);
  console.log(`📱 Mobile Test: http://localhost:${PORT}/index.html`);
  console.log(`🚀 Speed Specs: Gzip Active • In-Memory Cache Active`);
  console.log(`========================================================\n`);
});
