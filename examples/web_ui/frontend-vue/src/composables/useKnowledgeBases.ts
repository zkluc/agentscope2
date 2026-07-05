import { ref, onMounted, readonly } from 'vue';
import { knowledgeBaseApi } from '@/api';
import type { KnowledgeBaseView, CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest, SearchKnowledgeBaseRequest } from '@/api';

export function useKnowledgeBases() {
	const knowledgeBases = ref<KnowledgeBaseView[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		loading.value = true;
		error.value = null;
		try {
			const res = await knowledgeBaseApi.list();
			knowledgeBases.value = res.knowledge_bases;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		refetch();
	});

	async function create(body: CreateKnowledgeBaseRequest) {
		const res = await knowledgeBaseApi.create(body);
		await refetch();
		return res;
	}

	async function update(knowledgeBaseId: string, body: UpdateKnowledgeBaseRequest) {
		await knowledgeBaseApi.update(knowledgeBaseId, body);
		await refetch();
	}

	async function remove(knowledgeBaseId: string) {
		await knowledgeBaseApi.delete(knowledgeBaseId);
		await refetch();
	}

	async function search(knowledgeBaseId: string, body: SearchKnowledgeBaseRequest) {
		return knowledgeBaseApi.search(knowledgeBaseId, body);
	}

	return {
		knowledgeBases: readonly(knowledgeBases),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
		create,
		update,
		remove,
		search,
	};
}
