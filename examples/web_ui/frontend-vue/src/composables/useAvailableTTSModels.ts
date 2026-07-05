import { ref, onMounted, readonly } from 'vue';
import { credentialApi } from '@/api';
import { ttsModelApi } from '@/api';
import type { CredentialRecord, TTSModelCard } from '@/api';

interface ProviderTTSModels {
	credential: CredentialRecord;
	models: TTSModelCard[];
}

export function useAvailableTTSModels() {
	const providers = ref<ProviderTTSModels[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		loading.value = true;
		error.value = null;
		try {
			const credsRes = await credentialApi.list();
			const results: ProviderTTSModels[] = [];

			for (const cred of credsRes.credentials) {
				const providerType = (cred.data as Record<string, unknown>).type as string;
				if (!providerType) continue;
				const modelsRes = await ttsModelApi.list(providerType);
				if (modelsRes.models.length > 0) {
					results.push({ credential: cred, models: modelsRes.models });
				}
			}
			providers.value = results;
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
		providers: readonly(providers),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
	};
}
