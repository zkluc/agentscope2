import { ref, readonly } from 'vue';
import { knowledgeBaseApi } from '@/api';
import type { JSONSchema } from '@/api';

let cachedSchema: JSONSchema | null = null;

export function useKnowledgeBaseMiddlewareSchema() {
	const schema = ref<JSONSchema | null>(null);
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
			const res = await knowledgeBaseApi.middlewareParametersSchema();
			cachedSchema = res.parameter_schema as unknown as JSONSchema;
			schema.value = cachedSchema;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	return {
		schema: readonly(schema),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
	};
}
