import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const GITHUB_REPO = 'josemanuelac1993-crypto/INDICADORES-GESTION-CONSOLA-CBC';
const DEFAULT_BRANCH = 'main';
const LIVE_STATE_PATH = 'public/data/live-state.json';
const REPO_FOLDER = 'REPO PLATAFORMA';
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xlsm', '.xls', '.csv', '.docx']);
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_BODY_BYTES = 4_600_000;

interface IncomingRepoFile {
  originalName?: string;
  storedName: string;
  dataBase64: string;
}

function getSafeBranch(): string {
  const raw = String(process.env.GITHUB_BRANCH || DEFAULT_BRANCH).trim();
  return /^[a-zA-Z0-9._/-]+$/.test(raw) && !raw.includes('..') ? raw : DEFAULT_BRANCH;
}

function sanitizeStoredFileName(rawName: string): string | null {
  const clean = path.basename(String(rawName || '').trim());
  if (!clean || clean.includes('\0') || clean === '.' || clean === '..') return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(clean) || clean.includes('..')) return null;
  const ext = path.extname(clean).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  return clean;
}

function ghHeaders(token?: string, accept = 'application/vnd.github+json'): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'CCO-Tesalia-GitHub-Sync',
    Accept: accept
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const maybeReq = req as IncomingMessage & { body?: any };
  if (maybeReq.body !== undefined) {
    return typeof maybeReq.body === 'string' ? JSON.parse(maybeReq.body) : maybeReq.body;
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function fetchLiveSnapshotFromGitHub(token: string | undefined, branch: string) {
  // Prefer authenticated GitHub Contents API (zero CDN cache), fallback to raw.githubusercontent.com
  if (token) {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${LIVE_STATE_PATH}?ref=${encodeURIComponent(branch)}`,
      { headers: ghHeaders(token), cache: 'no-store' }
    );
    if (res.ok) {
      const json = (await res.json()) as any;
      if (json?.content) {
        const decoded = Buffer.from(String(json.content).replace(/\n/g, ''), 'base64').toString('utf8');
        return { snapshot: JSON.parse(decoded), sha: json.sha as string };
      }
    }
  }

  const rawRes = await fetch(
    `https://raw.githubusercontent.com/${GITHUB_REPO}/${encodeURIComponent(branch)}/${LIVE_STATE_PATH}?_ts=${Date.now()}`,
    { cache: 'no-store' }
  );
  if (rawRes.ok) {
    const snapshot = await rawRes.json().catch(() => null);
    return { snapshot, sha: null as string | null };
  }
  return { snapshot: null, sha: null as string | null };
}

async function listGitHubRepoFiles(token: string | undefined, branch: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(REPO_FOLDER)}?ref=${encodeURIComponent(branch)}`,
    { headers: ghHeaders(token), cache: 'no-store' }
  );
  if (!res.ok) return [];
  const entries = (await res.json().catch(() => [])) as any[];
  if (!Array.isArray(entries)) return [];

  return entries
    .filter(item => item?.type === 'file' && sanitizeStoredFileName(item.name))
    .map(item => {
      const storedName = String(item.name);
      const idx = storedName.indexOf('__');
      const originalName = idx >= 0 ? storedName.slice(idx + 2) : storedName;
      return {
        originalName,
        storedName,
        size: Number(item.size) || 0,
        uploadedAt: '',
        url: `/api/github-sync?download=${encodeURIComponent(storedName)}`,
        githubUrl: item.html_url || undefined
      };
    });
}

async function commitAtomicToGitHub(
  token: string,
  branch: string,
  commitMessage: string,
  entries: { path: string; contentBase64: string }[]
): Promise<{ sha: string }> {
  const baseUrl = `https://api.github.com/repos/${GITHUB_REPO}`;
  const headers = { ...ghHeaders(token), 'Content-Type': 'application/json' };

  for (let attempt = 0; attempt < 2; attempt++) {
    const refRes = await fetch(`${baseUrl}/git/ref/heads/${encodeURIComponent(branch)}`, {
      headers: ghHeaders(token),
      cache: 'no-store'
    });
    if (!refRes.ok) {
      throw new Error(`No se pudo consultar la rama ${branch} en GitHub (${refRes.status}).`);
    }
    const refData = (await refRes.json()) as any;
    const headSha = refData?.object?.sha;
    if (!headSha) throw new Error('Referencia HEAD inválida en GitHub.');

    const commitRes = await fetch(`${baseUrl}/git/commits/${headSha}`, {
      headers: ghHeaders(token),
      cache: 'no-store'
    });
    if (!commitRes.ok) throw new Error(`Error al leer commit base (${commitRes.status}).`);
    const commitData = (await commitRes.json()) as any;
    const baseTreeSha = commitData?.tree?.sha;

    const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];
    for (const entry of entries) {
      const blobRes = await fetch(`${baseUrl}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: entry.contentBase64, encoding: 'base64' })
      });
      if (!blobRes.ok) {
        const errText = await blobRes.text().catch(() => '');
        throw new Error(`Error al crear blob para ${entry.path} (${blobRes.status}): ${errText.slice(0, 120)}`);
      }
      const blobData = (await blobRes.json()) as any;
      treeItems.push({
        path: entry.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      });
    }

    const treeRes = await fetch(`${baseUrl}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
    });
    if (!treeRes.ok) throw new Error(`Error al construir árbol Git (${treeRes.status}).`);
    const treeData = (await treeRes.json()) as any;

    const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [headSha]
      })
    });
    if (!newCommitRes.ok) throw new Error(`Error al crear commit en GitHub (${newCommitRes.status}).`);
    const newCommitData = (await newCommitRes.json()) as any;

    const patchRes = await fetch(`${baseUrl}/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitData.sha, force: false })
    });

    if (patchRes.ok) {
      return { sha: newCommitData.sha };
    }
    if (patchRes.status !== 409 && patchRes.status !== 422) {
      const errText = await patchRes.text().catch(() => '');
      throw new Error(`Error al actualizar rama ${branch} (${patchRes.status}): ${errText.slice(0, 120)}`);
    }
  }

  throw new Error('Conflicto de concurrencia al actualizar GitHub. Intenta nuevamente.');
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const token = String(process.env.GITHUB_TOKEN || '').trim() || undefined;
  const branch = getSafeBranch();

  const reqUrl = new URL(req.url || '/api/github-sync', 'http://localhost');
  const downloadParam = reqUrl.searchParams.get('download');

  if (req.method === 'GET' && downloadParam) {
    const safeName = sanitizeStoredFileName(downloadParam);
    if (!safeName) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Nombre de archivo inválido.' }));
      return;
    }

    try {
      const fileUrl = token
        ? `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(REPO_FOLDER)}/${encodeURIComponent(safeName)}?ref=${encodeURIComponent(branch)}`
        : `https://raw.githubusercontent.com/${GITHUB_REPO}/${encodeURIComponent(branch)}/${encodeURIComponent(REPO_FOLDER)}/${encodeURIComponent(safeName)}`;

      const fileRes = await fetch(fileUrl, {
        headers: token ? ghHeaders(token, 'application/vnd.github.raw+json') : undefined,
        cache: 'no-store'
      });

      if (!fileRes.ok) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Archivo no encontrado en REPO PLATAFORMA de GitHub.' }));
        return;
      }

      const buf = Buffer.from(await fileRes.arrayBuffer());
      const origIdx = safeName.indexOf('__');
      const downloadName = (origIdx >= 0 ? safeName.slice(origIdx + 2) : safeName).replace(/["\r\n]/g, '_');
      res.statusCode = 200;
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.end(buf);
      return;
    } catch (err) {
      console.error('GitHub download error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Error al descargar desde GitHub.' }));
      return;
    }
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'GET') {
    try {
      const [{ snapshot }, repoFiles] = await Promise.all([
        fetchLiveSnapshotFromGitHub(token, branch),
        listGitHubRepoFiles(token, branch)
      ]);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          githubConfigured: Boolean(token),
          repo: GITHUB_REPO,
          branch,
          snapshot,
          repoFiles
        })
      );
    } catch (err) {
      console.error('GitHub GET sync error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: 'Error al consultar estado en GitHub.' }));
    }
    return;
  }

  if (req.method === 'POST') {
    let body: any;
    try {
      body = await readJsonBody(req);
    } catch (err: any) {
      res.statusCode = err?.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      res.end(
        JSON.stringify({
          ok: false,
          error:
            err?.message === 'PAYLOAD_TOO_LARGE'
              ? 'El lote supera el límite de transferencia de Vercel (4.5 MB).'
              : 'Solicitud JSON inválida.'
        })
      );
      return;
    }

    if (!body || typeof body !== 'object' || !body.feedState || typeof body.feedState !== 'object') {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: 'Payload feedState requerido.' }));
      return;
    }

    const updatedAt = typeof body.updatedAt === 'string' ? body.updatedAt : new Date().toISOString();
    const snapshot = {
      version: 1,
      updatedAt,
      summary: typeof body.summary === 'string' ? body.summary.slice(0, 300) : 'Actualización Consola CCO',
      feedState: body.feedState,
      customIncidents: Array.isArray(body.customIncidents) ? body.customIncidents.slice(0, 1000) : [],
      uploadHistory: Array.isArray(body.uploadHistory) ? body.uploadHistory.slice(0, 50) : []
    };

    if (!token) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          githubConfigured: false,
          committed: false,
          reason: 'GITHUB_TOKEN_MISSING',
          message:
            'Guardado en la nube en tiempo real (Firestore). Para respaldar también en GitHub desde la versión publicada, configura GITHUB_TOKEN en las variables de entorno del proyecto.'
        })
      );
      return;
    }

    try {
      const entries: { path: string; contentBase64: string }[] = [
        {
          path: LIVE_STATE_PATH,
          contentBase64: Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8').toString('base64')
        }
      ];

      const committedFiles: { originalName: string; storedName: string; size: number; uploadedAt: string; url: string }[] = [];
      if (Array.isArray(body.files)) {
        for (const f of body.files as IncomingRepoFile[]) {
          if (!f || typeof f.storedName !== 'string' || typeof f.dataBase64 !== 'string') continue;
          const safeName = sanitizeStoredFileName(f.storedName);
          if (!safeName) continue;
          const cleanB64 = f.dataBase64.includes(',') ? f.dataBase64.split(',').pop() || '' : f.dataBase64;
          const buf = Buffer.from(cleanB64, 'base64');
          if (buf.length === 0 || buf.length > MAX_UPLOAD_BYTES) continue;

          entries.push({
            path: `${REPO_FOLDER}/${safeName}`,
            contentBase64: buf.toString('base64')
          });
          const origIdx = safeName.indexOf('__');
          committedFiles.push({
            originalName:
              typeof f.originalName === 'string' && f.originalName.trim()
                ? path.basename(f.originalName.trim())
                : origIdx >= 0
                ? safeName.slice(origIdx + 2)
                : safeName,
            storedName: safeName,
            size: buf.length,
            uploadedAt: updatedAt,
            url: `/api/github-sync?download=${encodeURIComponent(safeName)}`
          });
        }
      }

      const commitMsg = `chore(cco): ${snapshot.summary}`;
      const { sha } = await commitAtomicToGitHub(token, branch, commitMsg, entries);

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          githubConfigured: true,
          committed: true,
          sha: sha.slice(0, 7),
          fullSha: sha,
          updatedAt,
          committedFiles
        })
      );
    } catch (err: any) {
      console.error('GitHub POST sync error:', err);
      res.statusCode = 502;
      res.end(
        JSON.stringify({
          ok: false,
          githubConfigured: true,
          committed: false,
          error: err?.message || 'Error al guardar cambios en GitHub.'
        })
      );
    }
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ ok: false, error: 'Método no permitido' }));
}
