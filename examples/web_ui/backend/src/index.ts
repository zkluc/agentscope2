import express from 'express';
import cors from 'cors';
import http from 'http';
import { loadConfig, proxyToUpstream } from './config';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const config = loadConfig();

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Health endpoint — always handled locally, never proxied.
app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok', upstream: config.upstream });
});

// ---------------------------------------------------------------------------
// Catch-all proxy
//
// Every request that is NOT /api/* is forwarded to the upstream AgentScope
// Python server.  This covers:
//
//   /agent/*          Agent CRUD + schema
//   /sessions/*       Session CRUD, messages, SSE stream, export
//   /chat/*           Chat trigger (fire-and-forget)
//   /credential/*     Credential CRUD + schemas
//   /model/*          Model card listing
//   /tts-model/*      TTS model card listing
//   /schedule/*       Schedule CRUD + session list
//   /workspace/*      MCP / skill management
//   /knowledge_bases/* KB CRUD, document upload, search
//
// SSE endpoints (GET /sessions/{id}/stream) are passthrough — the raw
// upstream response is piped directly so events arrive in real time.
// ---------------------------------------------------------------------------

app.use((req, res) => {
	proxyToUpstream(config, req, res);
});

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Optional WebSocket relay
//
// When ENABLE_WS_RELAY=1 the backend opens a Socket.IO namespace at /ws/events.
// Clients can subscribe to a session's event stream over WebSocket instead of
// raw SSE.  This is useful when a reverse proxy or corporate firewall strips
// long-lived SSE connections.
// ---------------------------------------------------------------------------

if (config.enableWsRelay) {
	import('socket.io').then(({ Server: SocketIOServer }) => {
		const io = new SocketIOServer(server, {
			cors: { origin: '*' },
			path: '/ws/events',
		});

		io.on('connection', (socket) => {
			console.log('[ws] client connected:', socket.id);

			// Client sends { sessionId, agentId } to start receiving events.
			socket.on('subscribe', async (payload: { sessionId: string; agentId: string }) => {
				const { sessionId, agentId } = payload;
				if (!sessionId || !agentId) return;

				const upstreamUrl =
					`${config.upstream}/sessions/${encodeURIComponent(sessionId)}/stream` +
					`?agent_id=${encodeURIComponent(agentId)}`;

				try {
					const resp = await fetch(upstreamUrl, {
						headers: {
							'x-user-id':
								(socket.handshake.headers['x-user-id'] as string) || '',
						},
					});
					if (!resp.ok || !resp.body) {
						socket.emit('error', {
							detail: `Upstream SSE request failed (${resp.status})`,
						});
						return;
					}

					const reader = resp.body.getReader();
					const decoder = new TextDecoder();
					let buffer = '';

					const pump = async (): Promise<void> => {
						while (true) {
							const { done, value } = await reader.read();
							if (done) break;

							buffer += decoder.decode(value, { stream: true });
							const lines = buffer.split('\n');
							buffer = lines.pop() ?? '';

							for (const line of lines) {
								if (line.startsWith('data: ')) {
									const json = line.slice(6).trim();
									if (json) {
										try {
											const event = JSON.parse(json);
											socket.emit('agent_event', event);
										} catch {
											// malformed JSON — skip
										}
									}
								}
								// SSE comment frames (heartbeats) are silently ignored.
							}
						}
					};

					pump().catch((e) => {
						socket.emit('error', { detail: String(e) });
					});
				} catch (e) {
					socket.emit('error', { detail: String(e) });
				}
			});

			socket.on('disconnect', () => {
				console.log('[ws] client disconnected:', socket.id);
			});
		});
	});
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.listen(config.port, () => {
	console.log(`[backend] listening on http://localhost:${config.port}`);
	console.log(`[backend] proxying to upstream ${config.upstream}`);
	if (config.enableWsRelay) {
		console.log('[backend] WebSocket relay enabled on /ws/events');
	}
});
