import { ref, readonly } from 'vue';
import { knowledgeBaseApi } from '@/api';

let cachedMediaTypes: string[] | null = null;
let cachedExtensions: string[] | null = null;

export function useKnowledgeSupportedContentTypes() {
	const mediaTypes = ref<string[]>([]);
	const extensions = ref<string[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		if (cachedMediaTypes !== null) {
			mediaTypes.value = cachedMediaTypes;
			extensions.value = cachedExtensions!;
			return;
		}
		loading.value = true;
		error.value = null;
		try {
			const res = await knowledgeBaseApi.supportedContentTypes();
			cachedMediaTypes = res.media_types;
			cachedExtensions = res.extensions;
			mediaTypes.value = res.media_types;
			extensions.value = res.extensions;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	return {
		mediaTypes: readonly(mediaTypes),
		extensions: readonly(extensions),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
	};
}
