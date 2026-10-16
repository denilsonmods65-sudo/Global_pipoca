import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to validate and sanitize URLs against SSRF/internal network probes
function isSafeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'NOCTRA PLAY IPTV Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Secure IPTV Proxy to overcome browser CORS limitations on external IPTV servers & streams
app.all('/api/iptv/proxy', async (req: Request, res: Response): Promise<void> => {
  const targetUrl = (req.query.url as string) || (req.body && req.body.url);

  if (!targetUrl || typeof targetUrl !== 'string') {
    res.status(400).json({ error: 'URL do servidor IPTV é obrigatória' });
    return;
  }

  if (!isSafeUrl(targetUrl)) {
    res.status(403).json({ error: 'URL inválida ou não autorizada por política de segurança' });
    return;
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'IPTVSmartersPlayer/3.1.5 (Linux; Android TV; NOCTRA PLAY)',
      'Accept': '*/*',
    };

    // Forward range headers if client requests partial video segments (video seeking)
    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const response = await fetch(targetUrl, {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers,
      body: req.method === 'POST' && req.body ? JSON.stringify(req.body.payload) : undefined,
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Servidor IPTV retornou status ${response.status} (${response.statusText})`,
        status: response.status,
      });
      return;
    }

    // Pass through relevant media/content headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

    if (response.status === 206) {
      res.status(206);
    }

    // Stream response body back to client
    if (response.body) {
      const reader = (response.body as any).getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch {
          res.end();
        }
      };
      await pump();
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na comunicação com o servidor IPTV';
    res.status(502).json({ error: message });
  }
});

// Configure Vite in Dev or Static in Production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[NOCTRA PLAY] Server running on port ${PORT}`);
  });
}

startServer();
