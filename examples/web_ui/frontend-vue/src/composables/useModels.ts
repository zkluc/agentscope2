import { ref, readonly } from 'vue';
import { modelApi, ttsModelApi } from '@/api';
import type { ModelCard, TTSModelCard } from '@/api';

export function useModels() {
	const chatModels = ref<ModelCard[]>([]);
	const ttsModels = ref<TTSModelCard[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function fetchChatModels(provider: string) {
		loading.value = true;
		error.value = null;
		try {
			const res = await modelApi.list(provider);
			chatModels.value = res.models;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	async function fetchTTSModels(provider: string) {
		loading.value = true;
		error.value = null;
		try {
			const res = await ttsModelApi.list(provider);
			ttsModels.value = res.models;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	return {
		chatModels: readonly(chatModels),
		ttsModels: readonly(ttsModels),
		loading: readonly(loading),
		error: readonly(error),
		fetchChatModels,
		fetchTTSModels,
	};
}
