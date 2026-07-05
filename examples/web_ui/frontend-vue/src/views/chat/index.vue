<template>
  <div class="flex h-full w-full">
    <div class="w-64 border-r bg-background flex flex-col shrink-0">
      <div class="p-3 border-b">
        <div class="text-xs text-muted-foreground mb-2">{{ serverUrl }}</div>
        <div class="flex items-center gap-2">
          <ElSelect
            id="tour-llm-select"
            :model-value="urlAgentId ?? ''"
            :placeholder="t('chat.agent.selectPlaceholder')"
            size="small"
            class="flex-1"
            @change="(id: string) => navigate(`/chat/${id}`)"
          >
            <ElOption
              v-for="agent in agents"
              :key="agent.id"
              :label="agent.data.name"
              :value="agent.id"
            />
          </ElSelect>
          <ElTooltip :content="t('chat.agent.create')">
            <ElButton id="tour-create-agent" size="small" @click="agentCreateOpen = true">
              <Plus class="size-4" />
            </ElButton>
          </ElTooltip>
          <ElTooltip :content="t('chat.agent.edit')">
            <ElButton size="small" :disabled="!urlAgentId" @click="editOpen = true">
              <Settings2 class="size-4" />
            </ElButton>
          </ElTooltip>
          <ElTooltip :content="t('chat.agent.delete')">
            <ElButton size="small" :disabled="!urlAgentId" @click="deleteOpen = true">
              <Trash2 class="size-4 text-destructive" />
            </ElButton>
          </ElTooltip>
        </div>
      </div>
      <div class="flex-1 overflow-auto p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-muted-foreground">{{ t('chat.session.label') }}</span>
          <ElButton id="tour-create-session" size="small" type="primary" :disabled="!urlAgentId" @click="handleCreateSession">
            <Plus class="size-3" />
          </ElButton>
        </div>
        <div v-if="sessions.length === 0" class="text-center py-8">
          <ElIcon :size="32" class="text-muted-foreground mb-2">
            <MessageSquare />
          </ElIcon>
          <p class="text-sm text-muted-foreground">
            {{ urlAgentId ? t('chat.session.emptyHasAgent') : t('chat.session.emptyNoAgent') }}
          </p>
          <ElButton size="small" class="mt-2" :disabled="!urlAgentId" @click="handleCreateSession">
            {{ t('chat.session.create') }}
          </ElButton>
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="view in sessions"
            :key="(view.session as any).id"
            :class="['flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:bg-muted group', urlSessionId === (view.session as any).id ? 'bg-muted' : '']"
            @click="navigate(`/chat/${urlAgentId}/${(view.session as any).id}`)"
          >
            <CalendarClock v-if="(view.session as any).source === 'schedule'" class="size-4 shrink-0 text-muted-foreground" />
            <BotMessageSquare v-else class="size-4 shrink-0 text-muted-foreground" />
            <span class="truncate flex-1">{{ (view.session as any).config?.name || (view.session as any).id }}</span>
            <ElDropdown trigger="click" @command="(cmd: string) => handleSessionAction(cmd, view.session as any)">
              <ElButton size="small" text class="opacity-0 group-hover:opacity-100">
                <Ellipsis class="size-3" />
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="rename">
                    <Pencil class="size-3 mr-2" /> {{ t('session-menu.rename') }}
                  </ElDropdownItem>
                  <ElDropdownItem command="export-json">
                    <Download class="size-3 mr-2" /> {{ t('session-menu.exportJson') }}
                  </ElDropdownItem>
                  <ElDropdownItem command="export-md">
                    <Download class="size-3 mr-2" /> {{ t('session-menu.exportMd') }}
                  </ElDropdownItem>
                  <ElDropdownItem command="delete" divided>
                    <Trash2 class="size-3 mr-2" /> {{ t('session-menu.delete') }}
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
        </div>
      </div>
    </div>

    <TeamSidebar
      v-if="currentView?.team && effectiveSessionId"
      :team="currentView!.team"
      :current-session-id="effectiveSessionId"
    />

    <div class="flex flex-1 min-w-0">
      <ChatViewport
        :agent-id="effectiveAgentId"
        :session-id="effectiveSessionId"

        :on-team-updated="refetchSessions"
      />
    </div>

    <AgentDialog
      :open="agentCreateOpen"
      @update:open="agentCreateOpen = $event"
      :on-created="refetchAgents"
    />

    <EditAgentDialog
      :open="editOpen"
      :agent="selectedAgent"
      @update:open="editOpen = $event"
      :on-updated="refetchAgents"
    />

    <ElDialog v-model="deleteOpen" :title="deleteDialogTitle" :width="400">
      <p>{{ t('common.deleteDescription') }}</p>
      <template #footer>
        <ElButton @click="deleteOpen = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="danger" @click="handleDeleteAgent">{{ t('dialog-agent-delete.confirm') }}</ElButton>
      </template>
    </ElDialog>

    <RenameSessionDialog
      :open="renameOpen"
      :current-name="renameName"
      @update:open="renameOpen = $event"
      :on-confirm="handleRenameConfirm"
    />

    <ElDialog v-model="deleteSessionOpen" :title="deleteSessionDialogTitle" :width="400">
      <p>{{ t('common.deleteDescription') }}</p>
      <template #footer>
        <ElButton @click="deleteSessionOpen = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="danger" @click="handleDeleteSessionConfirm">{{ t('dialog-session-delete.confirm') }}</ElButton>
      </template>
    </ElDialog>

    <ChatTourController
      :agents-count="agents.length"
      :sessions-count="sessions.length"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElSelect, ElOption, ElButton, ElDialog, ElTooltip, ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { Plus, Settings2, Trash2, Ellipsis, Pencil, Download, BotMessageSquare, CalendarClock, MessageSquare } from 'lucide-vue-next';
import { useAgents } from '@/composables/useAgents';
import { useSessions } from '@/composables/useSessions';
import { sessionApi } from '@/api';
import TeamSidebar from '@/components/team/TeamSidebar.vue';
import ChatViewport from './ChatViewport.vue';
import AgentDialog from '@/components/dialog/AgentDialog.vue';
import EditAgentDialog from '@/components/dialog/EditAgentDialog.vue';
import RenameSessionDialog from '@/components/dialog/RenameSessionDialog.vue';
import ChatTourController from '@/components/tour/ChatTourController.vue';
import { useTranslation } from '@/i18n/useI18n';

const router = useRouter();
const route = useRoute();
const { t } = useTranslation();
const { agents, refetch: refetchAgents, remove: removeAgent } = useAgents();

const urlAgentId = computed(() => (route.params.agentId as string) || null);
const urlSessionId = computed(() => (route.params.sessionId as string) || null);
const urlMemberId = computed(() => (route.params.memberId as string) || null);

const agentIdRef = computed(() => urlAgentId.value ?? undefined);

const { sessions, refetch: refetchSessions, create: createSession, update: updateSession, remove: removeSession } = useSessions(agentIdRef as any);

const serverUrl = computed(() => localStorage.getItem('server_url') || '');

const agentCreateOpen = ref(false);
const editOpen = ref(false);
const deleteOpen = ref(false);
const renameOpen = ref(false);
const renameName = ref('');
const renameSessionId = ref<string | null>(null);
const deleteSessionOpen = ref(false);
const sessionToDelete = ref<any>(null);

const selectedAgent = computed(() => agents.value.find((a) => a.id === urlAgentId.value) ?? null);
const currentView = computed(() => sessions.value.find((v) => (v.session as any).id === urlSessionId.value) ?? null);
const sessionToDeleteName = computed(() => sessionToDelete.value?.config?.name || sessionToDelete.value?.id || '');

const deleteDialogTitle = computed(() => t('common.deleteTitle', { name: `${t('dialog-agent-delete.entity')} "${selectedAgent.value?.data?.name ?? ''}"` }));
const deleteSessionDialogTitle = computed(() => t('common.deleteTitle', { name: `${t('dialog-session-delete.entity')} "${sessionToDeleteName.value}"` }));

const focusedMember = computed(() => {
  if (!urlMemberId.value || !currentView.value?.team) return null;
  return (currentView.value.team as any).members.find((m: any) => m.agent.id === urlMemberId.value) ?? null;
});

const effectiveAgentId = computed(() => focusedMember.value?.session_id ? focusedMember.value.agent.id : urlAgentId.value);
const effectiveSessionId = computed(() => focusedMember.value?.session_id ? focusedMember.value.session_id : urlSessionId.value);

function navigate(path: string) {
  router.push(path);
}

watch([agents, urlAgentId], () => {
  if (!urlAgentId.value && agents.value.length > 0) {
    navigate(`/chat/${agents.value[0].id}`);
  }
}, { immediate: true });

watch([urlAgentId, sessions], () => {
  if (!urlAgentId.value || sessions.value.length === 0) return;
  const matches = urlSessionId.value && sessions.value.some((v) => (v.session as any).id === urlSessionId.value);
  if (!matches) {
    navigate(`/chat/${urlAgentId.value}/${(sessions.value[0].session as any).id}`);
  }
}, { immediate: true });

const handleCreateSession = async () => {
  if (!urlAgentId.value) return;
  const seedConfig = (currentView.value?.session as any)?.config ?? (sessions.value[0]?.session as any)?.config;
  const res = await createSession({
    agent_id: urlAgentId.value,
    ...(seedConfig?.chat_model_config ? { chat_model_config: seedConfig.chat_model_config } : {}),
    ...(seedConfig?.fallback_chat_model_config ? { fallback_chat_model_config: seedConfig.fallback_chat_model_config } : {}),
  });
  navigate(`/chat/${urlAgentId.value}/${(res as any).session_id}`);
};

const handleDeleteAgent = async () => {
  if (!selectedAgent.value) return;
  await removeAgent(selectedAgent.value.id);
  router.replace('/chat');
  await refetchAgents();
};

const handleSessionAction = async (cmd: string, session: any) => {
  switch (cmd) {
    case 'rename':
      renameSessionId.value = session.id;
      renameName.value = session.config?.name || session.id;
      renameOpen.value = true;
      break;
    case 'delete':
      sessionToDelete.value = session;
      deleteSessionOpen.value = true;
      break;
    case 'export-json':
    case 'export-md':
      await handleExport(session, cmd === 'export-json' ? 'json' : 'md');
      break;
  }
};

const handleRenameConfirm = async (name: string) => {
  if (!renameSessionId.value) return;
  await updateSession(renameSessionId.value, { name });
  renameOpen.value = false;
};

const handleDeleteSessionConfirm = async () => {
  if (!sessionToDelete.value) return;
  const id = sessionToDelete.value.id;
  await removeSession(id);
  if (id === urlSessionId.value && urlAgentId.value) {
    router.replace(`/chat/${urlAgentId.value}`);
  }
  deleteSessionOpen.value = false;
};

const handleExport = async (session: any, format: 'json' | 'md') => {
  try {
    const res = await (sessionApi as any).exportSession(session.id, effectiveAgentId.value!, format);
    const disposition = (res as any).headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?(.+?)"?$/);
    const filename = match?.[1] ?? `session-${session.id}.${format}`;
    const blob = await (res as any).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch { /* handled by client */ }
};
</script>
