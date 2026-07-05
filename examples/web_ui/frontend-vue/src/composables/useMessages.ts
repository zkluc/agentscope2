import { ref, watch, readonly, type Ref } from 'vue';
import { sessionApi, chatApi } from '@/api';
import type { AgentEvent } from '@/api';
import { appendEvent, type Msg, type ToolCallBlock } from '@agentscope-ai/agentscope/message';
import { EventType, type ConfirmResult, type UserConfirmResultEvent } from '@agentscope-ai/agentscope/event';

export interface MessagesResponse {
	messages: Array<Record<string, unknown>>;
	is_running: boolean;
}

export interface UseMessagesOptions {
	onTeamUpdated?: () => void;
	onStateUpdated?: (value: Record<string, unknown>) => void;
}

export function useMessages(
	agentId: Ref<string | null>,
	sessionId: Ref<string | null>,
	options?: UseMessagesOptions,
) {
	const msgs = ref<Array<Record<string, unknown>>>([]);
	const loading = ref(false);
	const streaming = ref(false);
	const error = ref<Error | null>(null);
	const subagentHitl = ref<Array<Record<string, unknown>>>([]);

	let abortController: AbortController | null = null;
	let currentReply: Record<string, unknown> | null = null;
	let rafId: number | null = null;

	function scheduleUpdate() {
		if (rafId !== null) return;
		rafId = requestAnimationFrame(() => {
			rafId = null;
			msgs.value = [...msgs.value];
		});
	}

	function processEvent(event: AgentEvent) {
		if (event.type === EventType.REPLY_START) {
			const e = event as any;
			const newMsg: Record<string, unknown> = {
				id: e.reply_id,
				role: 'assistant',
				name: e.name,
				content: [],
				created_at: new Date().toISOString(),
			};
			msgs.value = [...msgs.value, newMsg];
			currentReply = msgs.value[msgs.value.length - 1];
			streaming.value = true;
			scheduleUpdate();
			return;
		}

		if (event.type === EventType.REPLY_END && currentReply) {
			appendEvent(currentReply as unknown as Msg, event);
			streaming.value = false;
			currentReply = null;
			scheduleUpdate();
			return;
		}

		if (event.type === EventType.CUSTOM) {
			const custom = event as any;
			if (custom.name === 'team_updated') {
				options?.onTeamUpdated?.();
			} else if (custom.name === 'state_updated') {
				options?.onStateUpdated?.(custom.value);
			} else if (custom.name === 'subagent_require_user_confirm') {
				subagentHitl.value.push(custom.payload);
			}
			return;
		}

		if (currentReply) {
			appendEvent(currentReply as unknown as Msg, event);
			scheduleUpdate();
		}
	}

	watch([agentId, sessionId], ([newAgentId, newSessionId], _, onCleanup) => {
		// Cleanup previous connection
		if (abortController) {
			abortController.abort();
			abortController = null;
		}

		msgs.value = [];
		streaming.value = false;
		subagentHitl.value = [];
		currentReply = null;

		if (!newAgentId || !newSessionId) return;

		const controller = new AbortController();
		abortController = controller;

		onCleanup(() => {
			controller.abort();
			abortController = null;
		});

		// Fetch history
		loading.value = true;
		error.value = null;
		sessionApi
			.messages(newSessionId, newAgentId)
			.then((res: MessagesResponse) => {
				msgs.value = res.messages;
			})
			.catch((e: Error) => {
				error.value = e;
			})
			.finally(() => {
				loading.value = false;
			});

		// Open SSE stream
		const startStreaming = async () => {
			try {
				for await (const event of sessionApi.streamEvents(newSessionId, newAgentId, controller.signal)) {
					if (controller.signal.aborted) break;
					processEvent(event);
				}
			} catch (e) {
				if ((e as Error).name !== 'AbortError') {
					error.value = e as Error;
				}
			}
		};
		startStreaming();
	}, { immediate: true });

	async function send(content: Record<string, unknown>) {
		if (!agentId.value || !sessionId.value) return;
		msgs.value = [...msgs.value, content];
		scheduleUpdate();
		await chatApi.trigger({
			agent_id: agentId.value,
			session_id: sessionId.value,
			input: content as any,
		});
	}

	async function onUserConfirm(toolCall: ToolCallBlock, confirmed: boolean, replyId: string, rules?: any) {
		if (!agentId.value || !sessionId.value) return;

		const confirmResult: ConfirmResult = {
			confirmed,
			tool_call: toolCall,
		};
		if (rules) {
			confirmResult.rules = rules;
		}

		const event: UserConfirmResultEvent = {
			type: EventType.USER_CONFIRM_RESULT,
			reply_id: replyId,
			confirm_results: [confirmResult],
		} as any;

		await chatApi.trigger({
			agent_id: agentId.value,
			session_id: sessionId.value,
			input: event as any,
		});
	}

	return {
		msgs,
		loading: readonly(loading),
		streaming: readonly(streaming),
		error: readonly(error),
		subagentHitl: readonly(subagentHitl),
		send,
		onUserConfirm,
	};
}
