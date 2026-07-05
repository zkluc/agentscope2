import { ref, watch, onMounted, readonly } from 'vue';
import { knowledgeBaseApi } from '@/api';
import type { KnowledgeDocumentView } from '@/api';

export function useKnowledgeDocuments(knowledgeBaseId: ReturnType<typeof ref<string | null>>) {
	const documents = ref<KnowledgeDocumentView[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		if (!knowledgeBaseId.value) return;
		loading.value = true;
		error.value = null;
		try {
			const res = await knowledgeBaseApi.listDocuments(knowledgeBaseId.value);
			documents.value = res.documents;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	watch(knowledgeBaseId, () => {
		refetch();
	});

	onMounted(() => {
		refetch();
	});

	async function deleteDocument(documentId: string) {
		if (!knowledgeBaseId.value) return;
		await knowledgeBaseApi.deleteDocument(knowledgeBaseId.value, documentId);
		await refetch();
	}

	return {
		documents: readonly(documents),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
		deleteDocument,
	};
}
