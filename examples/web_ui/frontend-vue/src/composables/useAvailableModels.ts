import { ref, computed, onMounted, readonly } from 'vue';
import { credentialApi } from '@/api';
import { modelApi } from '@/api';
import type { CredentialRecord, ModelCard } from '@/api';

interface ProviderModels {
	credential: CredentialRecord;
	models: ModelCard[];
}

export function useAvailableModels() {
	const providers = ref<ProviderModels[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		loading.value = true;
		error.value = null;
		try {
			const credsRes = await credentialApi.list();
			const groupMap: Record<string, ProviderModels[]> = {};

			await Promise.all(
				credsRes.credentials.map(async (cred) => {
					const providerType = (cred.data as Record<string, unknown>).type as string;
					if (!providerType) return;
					let models: ModelCard[] = [];
					try {
						const modelsRes = await modelApi.list(providerType);
						models = modelsRes.models;
					} catch {
						// per-credential error: still include with empty models
					}
					if (!groupMap[providerType]) groupMap[providerType] = [];
					groupMap[providerType].push({ credential: cred, models });
				}),
			);

			providers.value = Object.values(groupMap).flat();
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		refetch();
	});

	const groups = computed(() => {
		const g: Record<string, ProviderModels[]> = {};
		for (const p of providers.value) {
			const type = (p.credential.data as Record<string, unknown>).type as string;
			if (!g[type]) g[type] = [];
			g[type].push(p);
		}
		return g;
	});

	return {
		providers: readonly(providers),
		groups: readonly(groups),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
	};
}
