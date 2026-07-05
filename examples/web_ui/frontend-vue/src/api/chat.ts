import { client } from './client';
import type { ChatRequest } from './types';

export const chatApi = {
	trigger: (body: ChatRequest) =>
		client.post<{ status: string; session_id: string }>('/chat/', body),
};
