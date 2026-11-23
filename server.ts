import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = process.cwd();
const REPO_DIR = path.resolve(ROOT_DIR, 'REPO PLATAFORMA');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const MAX_FILES_PER_BATCH = 25;
const MAX_FILE_BYTES = 35 * 1024 * 1024; // 35 MB per file

const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xlsm', '.xls', '.csv', '.docx']);

fs.mkdirSync(REPO_DIR, { recursive: true });

interface IncomingUploadFile {
  name: string;
  dataBase64: string;
}

interface StoredFileMeta {
  originalName: string;
  storedName: string;
  size: number;
  uploadedAt: string;
  url: string;
}

function sanitizeOriginalFileName(rawName: string): { safeBase: string; ext: string } | null {
  const cleanName = path.basename(String(rawName || '').trim());
  if (!cleanName || cleanName.includes('\0')) return null;

  const ext = path.extname(cleanName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;

  const stem = cleanName.slice(0, cleanName.length - ext.length);
  const normalizedStem = stem
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[_.-]+|[_.-]+$/g, '')
    .slice(0, 90);

  return {
    safeBase: normalizedStem || 'archivo_cco',
    ext
  };
}

function buildStoredFileName(rawName: string): string | null {
  const parsed = sanitizeOriginalFileName(rawName);
  if (!parsed) return null;

  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('');
  const token = crypto.randomBytes(2).toString('hex');
  return `${stamp}_${token}__${parsed.safeBase}${parsed.ext}`;
}

function resolveSafeRepoPath(requestedName: string): string | null {
  const decoded = String(requestedName || '').trim();
  if (!decoded || decoded.includes('\0')) return null;

  const base = path.basename(decoded);
  if (base !== decoded || base === '.' || base === '..') return null;

  const ext = path.extname(base).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;

  const resolved = path.resolve(REPO_DIR, base);
  if (!resolved.startsWith(REPO_DIR + path.sep)) return null;
  return resolved;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, repoReady: fs.existsSync(REPO_DIR) });
  });

  // List stored Excel/Word files inside REPO PLATAFORMA
  app.get('/api/repo/files', async (_req: Request, res: Response) => {
    try {
      await fsp.mkdir(REPO_DIR, { recursive: true });
      const entries = await fsp.readdir(REPO_DIR, { withFileTypes: true });
      const results: StoredFileMeta[] = [];

      for (const entry of entries) {
        if (!entry.isFile() || entry.name.startsWith('.')) continue;
        const safePath = resolveSafeRepoPath(entry.name);
        if (!safePath) continue;
        const stats = await fsp.stat(safePath);
        const origIdx = entry.name.indexOf('__');
        const originalName = origIdx >= 0 ? entry.name.slice(origIdx + 2) : entry.name;
        results.push({
          originalName,
          storedName: entry.name,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          url: `/api/repo/download/${encodeURIComponent(entry.name)}`
        });
      }

      results.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      res.json({ ok: true, files: results });
    } catch (err) {
      console.error('Error listing REPO PLATAFORMA files:', err);
      res.status(500).json({ ok: false, error: 'No se pudo listar el repositorio local.' });
    }
  });

  // Save uploaded Excel/Word files to REPO PLATAFORMA
  app.post('/api/repo/upload', async (req: Request, res: Response) => {
    try {
      const body = req.body as { files?: IncomingUploadFile[] } | undefined;
      if (!body || !Array.isArray(body.files) || body.files.length === 0) {
        res.status(400).json({ ok: false, error: 'Se requiere al menos un archivo válido.' });
        return;
      }
      if (body.files.length > MAX_FILES_PER_BATCH) {
        res.status(400).json({ ok: false, error: `Máximo ${MAX_FILES_PER_BATCH} archivos por lote.` });
        return;
      }

      await fsp.mkdir(REPO_DIR, { recursive: true });
      const stored: StoredFileMeta[] = [];

      for (const item of body.files) {
        if (!item || typeof item.name !== 'string' || typeof item.dataBase64 !== 'string') {
          res.status(400).json({ ok: false, error: 'Formato de carga inválido.' });
          return;
        }

        const storedName = buildStoredFileName(item.name);
        if (!storedName) {
          res.status(400).json({
            ok: false,
            error: `Tipo de archivo no permitido (${path.basename(item.name)}). Solo .xlsx, .xlsm, .xls, .csv o .docx.`
          });
          return;
        }

        const cleanBase64 = item.dataBase64.includes(',')
          ? item.dataBase64.split(',').pop() || ''
          : item.dataBase64;
        const buffer = Buffer.from(cleanBase64, 'base64');

        if (buffer.length === 0 || buffer.length > MAX_FILE_BYTES) {
          res.status(400).json({
            ok: false,
            error: `Tamaño inválido para ${path.basename(item.name)} (máximo 35 MB).`
          });
          return;
        }

        const targetPath = resolveSafeRepoPath(storedName);
        if (!targetPath) {
          res.status(400).json({ ok: false, error: 'Nombre de archivo inválido.' });
          return;
        }

        await fsp.writeFile(targetPath, buffer);
        stored.push({
          originalName: path.basename(item.name),
          storedName,
          size: buffer.length,
          uploadedAt: new Date().toISOString(),
          url: `/api/repo/download/${encodeURIComponent(storedName)}`
        });
      }

      res.json({ ok: true, files: stored });
    } catch (err) {
      console.error('Error saving uploaded file to REPO PLATAFORMA:', err);
      res.status(500).json({ ok: false, error: 'Error al guardar archivo en REPO PLATAFORMA.' });
    }
  });

  // Download stored file from REPO PLATAFORMA
  app.get('/api/repo/download/:fileName', async (req: Request, res: Response) => {
    try {
      const rawParam = Array.isArray(req.params.fileName) ? req.params.fileName[0] : req.params.fileName;
      const safePath = resolveSafeRepoPath(rawParam);
      if (!safePath) {
        res.status(400).json({ ok: false, error: 'Nombre de archivo inválido.' });
        return;
      }

      let stats: fs.Stats;
      try {
        stats = await fsp.stat(safePath);
      } catch {
        res.status(404).json({ ok: false, error: 'Archivo no encontrado en REPO PLATAFORMA.' });
        return;
      }

      if (!stats.isFile()) {
        res.status(404).json({ ok: false, error: 'Recurso no disponible.' });
        return;
      }

      const fileName = path.basename(safePath);
      const origIdx = fileName.indexOf('__');
      const downloadName = origIdx >= 0 ? fileName.slice(origIdx + 2) : fileName;
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.download(safePath, downloadName);
    } catch (err) {
      console.error('Error downloading file from REPO PLATAFORMA:', err);
      res.status(500).json({ ok: false, error: 'Error al descargar el archivo.' });
    }
  });

  // Serve Vite in development or static dist/ in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CCO Plataforma server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
