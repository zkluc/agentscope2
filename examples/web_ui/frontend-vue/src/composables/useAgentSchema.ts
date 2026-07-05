import { ref, onMounted, readonly } from 'vue';
import { agentApi } from '@/api';
import type { AgentSchemaResponse } from '@/api';

let cachedSchema: AgentSchemaResponse | null = null;

export function useAgentSchema() {
	const schema = ref<AgentSchemaResponse | null>(cachedSchema);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		if (cachedSchema) {
			schema.value = cachedSchema;
			return;
		}
		loading.value = true;
		error.value = null;
		try {
			const res = await agentApi.getSchema();
			cachedSchema = res;
			schema.value = res;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		refetch();
	});

	return {
		schema: readonly(schema),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
	};
}
