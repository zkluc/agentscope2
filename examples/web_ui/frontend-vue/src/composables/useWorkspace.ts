import { ref, watch, onMounted, readonly } from 'vue';
import { workspaceApi } from '@/api';
import type { MCPClientStatus, Skill, AddSkillRequest, MCPClient } from '@/api';

export function useWorkspace(agentId: ReturnType<typeof ref<string>>, sessionId: ReturnType<typeof ref<string>>) {
	const mcpClients = ref<MCPClientStatus[]>([]);
	const skills = ref<Skill[]>([]);
	const mcpLoading = ref(false);
	const skillLoading = ref(false);
	const mcpError = ref<Error | null>(null);
	const skillError = ref<Error | null>(null);

	async function refetchMcp() {
		if (!agentId.value || !sessionId.value) return;
		mcpLoading.value = true;
		mcpError.value = null;
		try {
			mcpClients.value = await workspaceApi.mcp.list(agentId.value, sessionId.value);
		} catch (e) {
			mcpError.value = e as Error;
		} finally {
			mcpLoading.value = false;
		}
	}

	async function refetchSkills() {
		if (!agentId.value || !sessionId.value) return;
		skillLoading.value = true;
		skillError.value = null;
		try {
			skills.value = await workspaceApi.skill.list(agentId.value, sessionId.value);
		} catch (e) {
			skillError.value = e as Error;
		} finally {
			skillLoading.value = false;
		}
	}

	watch([agentId, sessionId], () => {
		refetchMcp();
		refetchSkills();
	});

	onMounted(() => {
		refetchMcp();
		refetchSkills();
	});

	async function addMcp(mcp: MCPClient) {
		if (!agentId.value || !sessionId.value) return;
		await workspaceApi.mcp.add(agentId.value, sessionId.value, mcp);
		await refetchMcp();
	}

	async function removeMcp(name: string) {
		if (!agentId.value || !sessionId.value) return;
		await workspaceApi.mcp.remove(name, agentId.value, sessionId.value);
		await refetchMcp();
	}

	async function addSkill(body: AddSkillRequest) {
		if (!agentId.value || !sessionId.value) return;
		await workspaceApi.skill.add(agentId.value, sessionId.value, body);
		await refetchSkills();
	}

	async function removeSkill(name: string) {
		if (!agentId.value || !sessionId.value) return;
		await workspaceApi.skill.remove(name, agentId.value, sessionId.value);
		await refetchSkills();
	}

	return {
		mcpClients: readonly(mcpClients),
		skills: readonly(skills),
		mcpLoading: readonly(mcpLoading),
		skillLoading: readonly(skillLoading),
		mcpError: readonly(mcpError),
		skillError: readonly(skillError),
		refetchMcp,
		refetchSkills,
		addMcp,
		removeMcp,
		addSkill,
		removeSkill,
	};
}
