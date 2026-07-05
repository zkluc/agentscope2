import { client } from './client';
import type {
	AgentEvent,
	CreateSessionRequest,
	CreateSessionResponse,
	SessionListResponse,
	SessionRecord,
	UpdateSessionRequest,
} from './types';

export interface MessagesResponse {
	messages: Array<Record<string, unknown>>;
	is_running: boolean;
}

export const sessionApi = {
	list: (agentId: string) => client.get<SessionListResponse>('/sessions/', { agent_id: agentId }),
	create: (body: CreateSessionRequest) => client.post<CreateSessionResponse>('/sessions/', body),
	update: (sessionId: string, agentId: string, body: UpdateSessionRequest) =>
		client.patch<SessionRecord>(`/sessions/${sessionId}`, body, { agent_id: agentId }),
	delete: (sessionId: string, agentId: string) =>
		client.delete(`/sessions/${sessionId}`, { agent_id: agentId }),
	messages: (sessionId: string, agentId: string, offset = 0, limit = 50) =>
		client.get<MessagesResponse>(`/sessions/${sessionId}/messages`, {
			agent_id: agentId,
			offset: String(offset),
			limit: String(limit),
		}),
	exportSession: (sessionId: string, agentId: string, format: 'json' | 'md') =>
		client.stream(`/sessions/${sessionId}/export`, {
			method: 'GET',
			params: { agent_id: agentId, format },
		}),
	streamEvents: async function* (
		sessionId: string,
		agentId: string,
		signal?: AbortSignal,
	): AsyncGenerator<AgentEvent> {
		const res = await client.stream(`/sessions/${sessionId}/stream`, {
			method: 'GET',
			params: { agent_id: agentId },
			signal,
		});

		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const json = line.slice(6).trim();
						if (json) yield JSON.parse(json) as AgentEvent;
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	},
};
