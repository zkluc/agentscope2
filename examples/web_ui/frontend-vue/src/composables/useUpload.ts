import { provide, inject, ref, readonly, watch, onMounted, onUnmounted } from 'vue';

export type UploadPhase = 'queued' | 'uploading' | 'processing' | 'ready' | 'error' | 'dismissed';

export interface UploadTask {
	taskId: string;
	file: File;
	progress: number;
	phase: UploadPhase;
	error?: string;
	documentId?: string;
}

const MAX_CONCURRENT_UPLOADS = 3;
const UploadContextKey = Symbol('uploadContext');

interface UploadAction {
	type: 'enqueue' | 'cancel' | 'dismiss' | 'clear' | 'setStatuses';
	payload?: unknown;
	tasks?: UploadTask[];
}

function reducer(tasks: UploadTask[], action: UploadAction): UploadTask[] {
	switch (action.type) {
		case 'enqueue': {
			const task = action.payload as UploadTask;
			return [...tasks, task];
		}
		case 'cancel': {
			const taskId = action.payload as string;
			return tasks.map((t) => (t.taskId === taskId ? { ...t, phase: 'dismissed' as const } : t));
		}
		case 'dismiss': {
			const taskId = action.payload as string;
			return tasks.filter((t) => t.taskId !== taskId);
		}
		case 'clear':
			return [];
		case 'setStatuses': {
			const items = action.tasks as UploadTask[] | undefined;
			if (!items) return tasks;
			return tasks.map((t) => {
				const updated = items.find((i) => i.taskId === t.taskId);
				return updated ? { ...t, ...updated } : t;
			});
		}
		default:
			return tasks;
	}
}

export function useUploadProvider() {
	const tasks = ref<UploadTask[]>([]);
	const controllers = new Map<string, AbortController>();
	const started = new Set<string>();

	function dispatch(action: UploadAction) {
		tasks.value = reducer(tasks.value, action);
	}

	// Concurrency limiter
	watch(tasks, (newTasks) => {
		const running = newTasks.filter((t) => t.phase === 'uploading').length;
		const queued = newTasks.filter((t) => t.phase === 'queued');
		const slots = MAX_CONCURRENT_UPLOADS - running;
		if (slots <= 0) return;
		for (const task of queued.slice(0, slots)) {
			if (started.has(task.taskId)) continue;
			started.add(task.taskId);
			startUpload(task);
		}
	}, { deep: true });

	async function startUpload(_task: UploadTask) {
		// Override in actual usage with real upload logic
	}

	function enqueue(file: File, taskId: string) {
		dispatch({ type: 'enqueue', payload: { taskId, file, progress: 0, phase: 'queued' as const } });
	}

	function cancel(taskId: string) {
		const ctrl = controllers.get(taskId);
		if (ctrl) ctrl.abort();
		dispatch({ type: 'cancel', payload: taskId });
	}

	function dismiss(taskId: string) {
		dispatch({ type: 'dismiss', payload: taskId });
	}

	function clear() {
		dispatch({ type: 'clear' });
		started.clear();
	}

	// beforeunload warning
	onMounted(() => {
		const handler = (e: BeforeUnloadEvent) => {
			const inFlight = tasks.value.some((t) => t.phase === 'uploading' || t.phase === 'queued');
			if (inFlight) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handler);
		onUnmounted(() => window.removeEventListener('beforeunload', handler));
	});

	const value = {
		tasks: readonly(tasks),
		enqueue,
		cancel,
		dismiss,
		clear,
	};

	provide(UploadContextKey, value);

	return value;
}

export function useUploadContext() {
	return inject(UploadContextKey, null) as ReturnType<typeof useUploadProvider> | null;
}
