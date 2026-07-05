import { ref, readonly } from 'vue';
import { chatApi } from '@/api';

export function useChat() {
	const streaming = ref(false);

	async function trigger(body: Record<string, unknown>) {
		streaming.value = true;
		try {
			await chatApi.trigger(body as any);
		} finally {
			streaming.value = false;
		}
	}

	return {
		streaming: readonly(streaming),
		trigger,
	};
}
