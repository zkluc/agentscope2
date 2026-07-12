import http from 'http';
import { URL } from 'url';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface BackendConfig {
	port: number;
	upstream: string;
	enableWsRelay: boolean;
}

export function loadConfig(): BackendConfig {
	return {
		port: Number(process.env.PORT || 3000),
		upstream: (process.env.AGENTSCOPE_UPSTREAM || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
		enableWsRelay: process.env.ENABLE_WS_RELAY === '1',
	};
}

// ---------------------------------------------------------------------------
// Proxy — raw http.request + pipe, zero buffering, SSE-safe.
// ---------------------------------------------------------------------------

export function proxyToUpstream(
	config: BackendConfig,
	req: http.IncomingMessage,
	res: http.ServerResponse,
): void {
	const upstreamUrl = new URL(req.url || '/', config.upstream);

	// Forward every header the client sent (except hop-by-hop).
	const headers: Record<string, string> = {};
	for (const [key, val] of Object.entries(req.headers)) {
		if (val === undefined) continue;
		const lower = key.toLowerCase();
		if (['connection', 'keep-alive', 'transfer-encoding'].includes(lower)) continue;
		headers[key] = Array.isArray(val) ? val[0] : val;
	}

	const options: http.RequestOptions = {
		hostname: upstreamUrl.hostname,
		port: upstreamUrl.port,
		path: upstreamUrl.pathname + upstreamUrl.search,
		method: req.method,
		headers,
	};

	console.log(`[proxy] ${req.method} ${req.url} -> ${config.upstream}${upstreamUrl.pathname}${upstreamUrl.search}`);

	const proxyReq = http.request(options, (proxyRes) => {
		console.log(`[proxy] <- ${proxyRes.statusCode} for ${req.url}`);

		// Copy ALL response headers as-is.
		const responseHeaders: Record<string, string | string[]> = {};
		for (const [key, value] of Object.entries(proxyRes.headers)) {
			if (value !== undefined) {
				responseHeaders[key] = value as string | string[];
			}
		}

		// CORS
		if (!responseHeaders['access-control-allow-origin']) {
			responseHeaders['access-control-allow-origin'] = '*';
		}

		// Prevent any intermediary from buffering SSE.
		responseHeaders['x-accel-buffering'] = 'no';
		responseHeaders['cache-control'] = 'no-cache, no-transform';
		responseHeaders['connection'] = 'keep-alive';

		res.writeHead(proxyRes.statusCode || 502, responseHeaders);
		// Direct pipe — zero buffering, SSE flows chunk-by-chunk.
		proxyRes.pipe(res);

		proxyRes.on('end', () => {
			console.log(`[proxy] stream ended for ${req.url}`);
		});
	});

	proxyReq.on('error', (err) => {
		console.error(`[proxy] ${req.method} ${req.url} -> error:`, err.message);
		if (!res.headersSent) {
			res.writeHead(502, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ detail: `Upstream unreachable: ${err.message}` }));
		}
	});

	proxyReq.setTimeout(300_000, () => {
		console.error(`[proxy] timeout for ${req.url}`);
		proxyReq.destroy();
		if (!res.headersSent) {
			res.writeHead(504, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ detail: 'Upstream timeout' }));
		}
	});

	// Pipe request body (GET has no body — pipe ends immediately).
	req.pipe(proxyReq);
}
