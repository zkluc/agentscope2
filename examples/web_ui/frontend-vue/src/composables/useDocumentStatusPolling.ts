import { ref, readonly, type Ref } from 'vue';
import { knowledgeBaseApi } from '@/api';
import type { KnowledgeDocumentView } from '@/api';

/**
 * Conditional polling for document indexing status.
 * Combines in-flight docs with server-side non-terminal docs.
 */
export function useDocumentStatusPolling(
	knowledgeBaseId: string,
	docIds: Ref<string[]>,
) {
	const statuses = ref<Map<string, KnowledgeDocumentView>>(new Map());
	const polling = ref(false);
	const error = ref<Error | null>(null);

	let pollTimer: ReturnType<typeof setInterval> | null = null;

	function isTerminal(status: string): boolean {
		return status === 'ready' || status === 'error';
	}

	async function poll() {
		if (docIds.value.length === 0) {
			polling.value = false;
			if (pollTimer) clearInterval(pollTimer);
			return;
		}

		try {
			const res = await knowledgeBaseApi.getDocumentStatus(knowledgeBaseId, docIds.value);
			const newStatuses = new Map<string, KnowledgeDocumentView>();
			for (const doc of res.items) {
				newStatuses.set(doc.id, doc);
			}
			statuses.value = newStatuses;

			// Stop polling if all docs reached terminal state
			const allTerminal = res.items.every((d) => isTerminal(d.status));
			if (allTerminal) {
				polling.value = false;
				if (pollTimer) clearInterval(pollTimer);
			}
		} catch (e) {
			error.value = e as Error;
		}
	}

	function startPolling() {
		polling.value = true;
		poll();
		pollTimer = setInterval(poll, 1500);
	}

	function stopPolling() {
		polling.value = false;
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	return {
		statuses: readonly(statuses),
		polling: readonly(polling),
		error: readonly(error),
		poll,
		startPolling,
		stopPolling,
	};
}
