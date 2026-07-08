import { ref, watch, onMounted, readonly } from 'vue';
import { sessionApi } from '@/api';
import type {
	SessionView,
	CreateSessionRequest,
	UpdateSessionRequest,
} from '@/api';

export function useSessions(agentId: ReturnType<typeof ref<string>>) {
	const sessions = ref<SessionView[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		if (!agentId.value) return;
		loading.value = true;
		error.value = null;
		try {
			const res = await sessionApi.list(agentId.value);
			sessions.value = res.sessions;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	watch(agentId, () => {
		sessions.value = [];
		refetch();
	});

	onMounted(() => {
		refetch();
	});

	async function create(body: CreateSessionRequest) {
		const res = await sessionApi.create(body);
		await refetch();
		return res;
	}

	async function update(sessionId: string, body: UpdateSessionRequest) {
		if (!agentId.value) return;
		await sessionApi.update(sessionId, agentId.value, body);
		await refetch();
	}

	async function remove(sessionId: string) {
		if (!agentId.value) return;
		await sessionApi.delete(sessionId, agentId.value);
		await refetch();
	}

	return {
		sessions: readonly(sessions),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
		create,
		update,
		remove,
	};
}
