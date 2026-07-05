import { provide, inject, ref, readonly, onUnmounted, watchEffect } from 'vue';
import type { Ref } from 'vue';
import { StreamingAudioManager, type StreamingAudioState } from '@/utils/streamingAudio';

const AudioManagerKey = Symbol('audioManager');
const ReplayControllerKey = Symbol('replayController');

export function useAudioProvider() {
	const manager = new StreamingAudioManager();

	const currentRef = ref<HTMLAudioElement | null>(null);
	const replay = {
		play: (el: HTMLAudioElement) => {
			currentRef.value = el;
			el.play().catch(() => {});
		},
		stop: () => {
			if (currentRef.value) {
				currentRef.value.pause();
				currentRef.value = null;
			}
		},
	};

	onUnmounted(() => {
		manager.disposeAll();
	});

	provide(AudioManagerKey, manager);
	provide(ReplayControllerKey, replay);

	return { manager, replay };
}

export function useAudioManager() {
	return inject(AudioManagerKey, null) as StreamingAudioManager | null;
}

export function useReplayController() {
	return inject(ReplayControllerKey, null) as {
		play: (el: HTMLAudioElement) => void;
		stop: () => void;
	} | null;
}

export function useAudioBlock(blockId: Ref<string | undefined>) {
	const manager = useAudioManager();
	const state = ref<StreamingAudioState | null>(null);

	watchEffect((onCleanup) => {
		const id = blockId.value;
		if (!id || !manager) {
			state.value = null;
			return;
		}

		state.value = manager.getState(id);
		const unsubscribe = manager.subscribe(id, () => {
			state.value = manager.getState(id);
		});
		onCleanup(() => unsubscribe());
	});

	return readonly(state);
}
