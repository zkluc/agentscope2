import { ref, watch, onMounted, readonly } from 'vue';
import { workspaceApi } from '@/api';
import type { Skill, AddSkillRequest } from '@/api';

export function useSkills(agentId: ReturnType<typeof ref<string>>, sessionId: ReturnType<typeof ref<string>>) {
	const skills = ref<Skill[]>([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function refetch() {
		if (!agentId.value || !sessionId.value) return;
		loading.value = true;
		error.value = null;
		try {
			skills.value = await workspaceApi.skill.list(agentId.value, sessionId.value);
		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	}

	watch([agentId, sessionId], () => {
		refetch();
	});

	onMounted(() => {
		refetch();
	});

	async function add(body: AddSkillRequest) {
		await workspaceApi.skill.add(agentId.value!, sessionId.value!, body);
		await refetch();
	}

	async function remove(skillName: string) {
		await workspaceApi.skill.remove(skillName, agentId.value!, sessionId.value!);
		await refetch();
	}

	return {
		skills: readonly(skills),
		loading: readonly(loading),
		error: readonly(error),
		refetch,
		add,
		remove,
	};
}
