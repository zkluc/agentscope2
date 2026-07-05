import { ref, onMounted, readonly } from 'vue';
import { agentApi } from '@/api';
import type { AgentRecord, CreateAgentRequest, UpdateAgentRequest } from '@/api';

export function useAgents() {
	const agents = ref<AgentRecord[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		loading.value = true;
		error.value = null;
		try {
			const res = await agentApi.list();
			agents.value = res.agents;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		refetch();
	});

	async function create(body: CreateAgentRequest) {
		const res = await agentApi.create(body);
		await refetch();
		return res;
	}

	async function update(agentId: string, body: UpdateAgentRequest) {
		await agentApi.update(agentId, body);
		await refetch();
	}

	async function remove(agentId: string) {
		await agentApi.delete(agentId);
		await refetch();
	}

	return {
		agents: readonly(agents),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
		create,
		update,
		remove,
	};
}
