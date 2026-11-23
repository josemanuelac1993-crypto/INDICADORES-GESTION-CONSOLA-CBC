import type { IncomingMessage, ServerResponse } from 'node:http';

const GITHUB_REPO = 'josemanuelac1993-crypto/INDICADORES-GESTION-CONSOLA-CBC';
const VERCEL_LIVE_URL = 'https://indicadores-gestion-consola-cbc.vercel.app';
const ALLOWED_HOOK_PREFIX = 'https://api.vercel.com/v1/integrations/deploy/';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Método no permitido' }));
    return;
  }

  try {
    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/commits/main`,
      { headers: { 'User-Agent': 'CCO-Tesalia-Sync', Accept: 'application/vnd.github+json' } }
    );
    const commitData = commitRes.ok ? ((await commitRes.json()) as any) : null;
    const sha: string | null = commitData?.sha || null;

    let vercelStatus: { state?: string; description?: string; updatedAt?: string; targetUrl?: string } | null = null;
    if (sha) {
      const statusRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/commits/${sha}/status`,
        { headers: { 'User-Agent': 'CCO-Tesalia-Sync', Accept: 'application/vnd.github+json' } }
      );
      if (statusRes.ok) {
        const statusJson = (await statusRes.json()) as any;
        const vStatus = Array.isArray(statusJson?.statuses)
          ? statusJson.statuses.find((s: any) => String(s?.context || '').toLowerCase().includes('vercel'))
          : null;
        if (vStatus) {
          vercelStatus = {
            state: vStatus.state,
            description: vStatus.description,
            updatedAt: vStatus.updated_at,
            targetUrl: vStatus.target_url
          };
        }
      }
    }

    // Check live Vercel HTML bundle & cache headers
    let vercelLive: {
      status: number;
      lastModified: string | null;
      cacheStatus: string | null;
      ageSeconds: number | null;
      assetBundle: string | null;
    } | null = null;

    try {
      const liveRes = await fetch(`${VERCEL_LIVE_URL}/?_sync=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      });
      const html = await liveRes.text();
      const assetMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
      const ageRaw = liveRes.headers.get('age');
      vercelLive = {
        status: liveRes.status,
        lastModified: liveRes.headers.get('last-modified'),
        cacheStatus: liveRes.headers.get('x-vercel-cache'),
        ageSeconds: ageRaw != null ? Number(ageRaw) : null,
        assetBundle: assetMatch ? assetMatch[1] : null
      };
    } catch {
      vercelLive = null;
    }

    // Trigger Vercel Deploy Hook if POST and configured safely in server env
    let deployTriggered = false;
    let deployJobId: string | null = null;
    let hookConfigured = false;
    const rawHook = String(process.env.VERCEL_DEPLOY_HOOK_URL || '').trim();
    if (rawHook.startsWith(ALLOWED_HOOK_PREFIX)) {
      hookConfigured = true;
      if (req.method === 'POST') {
        const hookRes = await fetch(rawHook, { method: 'POST' });
        if (hookRes.ok) {
          const hookJson = (await hookRes.json().catch(() => null)) as any;
          deployTriggered = true;
          deployJobId = hookJson?.job?.id || 'triggered';
        }
      }
    }

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        checkedAt: new Date().toISOString(),
        github: commitData
          ? {
              branch: 'main',
              sha: sha ? sha.slice(0, 7) : null,
              fullSha: sha,
              message: String(commitData?.commit?.message || '').split('\n')[0],
              date: commitData?.commit?.author?.date || null
            }
          : null,
        vercelStatus,
        vercelLive,
        hookConfigured,
        deployTriggered,
        deployJobId
      })
    );
  } catch (err) {
    console.error('Vercel sync error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: 'No se pudo consultar el estado de GitHub/Vercel.' }));
  }
}
