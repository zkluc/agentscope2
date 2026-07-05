import { ref, readonly } from 'vue';
import { knowledgeBaseApi } from '@/api';
import type { ListKbEmbeddingModelsResponse, KbEmbeddingProvider, DimensionPolicy } from '@/api';

let cachedProviders: ListKbEmbeddingModelsResponse | null = null;

export function useKbEmbeddingModels() {
	const providers = ref<KbEmbeddingProvider[]>([]);
	const policy = ref<DimensionPolicy | null>(null);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		if (cachedProviders) {
			providers.value = cachedProviders.providers;
			policy.value = cachedProviders.policy;
			return;
		}
		loading.value = true;
		error.value = null;
		try {
			const res = await knowledgeBaseApi.listEmbeddingModels();
			cachedProviders = res;
			providers.value = res.providers;
			policy.value = res.policy;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	return {
		providers: readonly(providers),
		policy: readonly(policy),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
	};
}
