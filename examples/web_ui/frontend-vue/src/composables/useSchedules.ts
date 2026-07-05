import { ref, onMounted, readonly } from 'vue';
import { scheduleApi } from '@/api';
import type { ScheduleRecord, CreateScheduleRequest, UpdateScheduleRequest } from '@/api';

export function useSchedules() {
	const schedules = ref<ScheduleRecord[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		loading.value = true;
		error.value = null;
		try {
			const res = await scheduleApi.list();
			schedules.value = res.schedules;
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		refetch();
	});

	async function create(body: CreateScheduleRequest) {
		const res = await scheduleApi.create(body);
		await refetch();
		return res;
	}

	async function update(scheduleId: string, body: UpdateScheduleRequest) {
		await scheduleApi.update(scheduleId, body);
		await refetch();
	}

	async function remove(scheduleId: string) {
		await scheduleApi.delete(scheduleId);
		await refetch();
	}

	return {
		schedules: readonly(schedules),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
		create,
		update,
		remove,
	};
}
