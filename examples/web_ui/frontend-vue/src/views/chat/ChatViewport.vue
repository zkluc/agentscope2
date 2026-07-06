<template>
  <main class="flex size-full">
    <Splitpanes class="default-theme flex-1">
      <Pane :min-size="30" class="flex flex-1">
        <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-x-hidden">
          <div class="flex items-center justify-between px-3 py-2 border-b bg-background/80 backdrop-blur-sm">
            <div class="flex items-center gap-1.5">
              <LlmSelect
                :value="selectedModel"
                :on-change="handleLlmChange"
                :on-add-credential="() => credentialOpen = true"
                :refetch-trigger="credentialRefetchTrigger"
              />
              <ModelParametersPopover
                :selected-model="selectedModel"
                :model-card="selectedModelCard"
                :on-change="handleParametersChange"
                :selected-fallback-model="selectedFallbackModel"
                :on-fallback-change="handleFallbackChange"
                :selectedTTSModel="selectedTTSModel"
                :onTTSChange="handleTTSChange as any"
              />
            </div>
            <div id="tour-permission-mode" class="flex items-center gap-1">
              <PermissionModeSelect
                :value="selectedPermissionMode"
                :disabled="!sessionId"
                :on-change="handlePermissionModeChange"
              />
              <ElDropdown trigger="click" @command="togglePanel">
                <ElButton size="small" class="gap-1 px-2">
                  <PanelRight class="size-3.5" />
                  <ChevronDown class="size-3 text-muted-foreground" />
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="plan">
                      <ListTodo class="size-3.5 mr-2" /> {{ t('panel.plan.title') }}
                    </ElDropdownItem>
                    <ElDropdownItem command="skill">
                      <BookText class="size-3.5 mr-2" /> {{ t('panel.skill.title') }}
                    </ElDropdownItem>
                    <ElDropdownItem command="permission">
                      <ShieldCheck class="size-3.5 mr-2" /> {{ t('panel.permission.title') }}
                    </ElDropdownItem>
                    <ElDropdownItem command="knowledge" divided>
                      <Database class="size-3.5 mr-2" /> {{ t('panel.knowledge.title') }}
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
          </div>
          <div class="flex flex-1 justify-center min-h-0 overflow-hidden relative" style="--chat-content-w: 48rem">
            <ChatContent
              :msgs="msgs as any"
              :sending="streaming"
              :disabled="selectedModel === null"
              :on-send="sendMsg"
              :on-user-confirm="handleUserConfirm"
              :allowed-input-types="allowedInputTypes"
              :file-processor="fileProcessor"
              class="max-w-[var(--chat-content-w)] w-full"
            >
              <template v-if="subagentHitl.length > 0" #footer>
                <div class="space-y-2 pb-2">
                  <SubagentHitlCard
                    v-for="(entry, idx) in subagentHitl"
                    :key="idx"
                    :entry="entry"
                    :on-confirm="(toolCall: any, confirm: boolean, rules?: any) => handleSubagentConfirm(entry, toolCall, confirm, rules)"
                  />
                </div>
              </template>
            </ChatContent>
          </div>
        </div>
      </Pane>
      <Pane v-if="panelLayout.length > 0" :size="25" :min-size="15">
        <div class="h-full overflow-auto p-3">
          <div v-for="(col, colIdx) in panelLayout" :key="colIdx">
            <div v-for="key in col" :key="key" class="rounded-xl border bg-card p-4 mb-3">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ListTodo v-if="key === 'plan'" class="size-4 text-primary" />
                  <BookText v-if="key === 'skill'" class="size-4 text-secondary" />
                  <ShieldCheck v-if="key === 'permission'" class="size-4 text-primary" />
                  <Database v-if="key === 'knowledge'" class="size-4 text-secondary" />
                  <span>{{ panelLabel(key) }}</span>
                </div>
                <ElButton size="small" circle @click="closePanel(key)">
                  <X class="size-3" />
                </ElButton>
              </div>
              <div class="text-sm text-muted-foreground">
                <TaskPanel v-if="key === 'plan'" :tasks-context="tasksContext" />
                <SkillPanel
                  v-if="key === 'skill'"
                  :skills="skillList"
                  :loading="skillListLoading"
                  :on-add="addSkill"
                  :on-remove="removeSkillItem"
                />
                <PermissionPanel v-if="key === 'permission'" :permission-context="permissionContext" />
                <McpPanel
                  v-if="key === 'mcp'"
                  :mcps="mcpList"
                  :loading="mcpListLoading"
                  :on-add="addMcp"
                  :on-remove="removeMcpItem"
                  v-show="false"
                />
                <KnowledgeBasePanel
                  v-if="key === 'knowledge'"
                  :knowledge-bases="knowledgeBasesList"
                  :loading="knowledgeBasesLoading"
                  :value="selectedKnowledgeConfig"
                  :on-change="handleKnowledgeConfigChange"
                  :disabled="!sessionId"
                />
              </div>
            </div>
          </div>
        </div>
      </Pane>
    </Splitpanes>
    <CreateCredentialDialog
      :open="credentialOpen"
      :on-open-change="(v: boolean) => credentialOpen = v"
      :on-created="() => credentialRefetchTrigger++"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElButton, ElMessage } from 'element-plus';
import { PanelRight, ChevronDown, ListTodo, BookText, ShieldCheck, Database, X } from 'lucide-vue-next';
import type { ChatModelConfig, TTSModelConfig, SessionKnowledgeConfig, ContentBlock } from '@/api';
import type { ToolCallBlock } from '@agentscope-ai/agentscope/message';
import { UserMsg } from '@agentscope-ai/agentscope/message';
import { sessionApi } from '@/api';
import ChatContent from '@/components/chat/ChatContent.vue';
import SubagentHitlCard from '@/components/chat/SubagentHitlCard.vue';
import LlmSelect from '@/components/select/LlmSelect.vue';
import PermissionModeSelect from '@/components/select/PermissionModeSelect.vue';
import ModelParametersPopover from '@/components/popover/ModelParametersPopover.vue';
import TaskPanel from '@/components/panel/TaskPanel.vue';
import PermissionPanel from '@/components/panel/PermissionPanel.vue';
import SkillPanel from '@/components/panel/SkillPanel.vue';
import McpPanel from '@/components/panel/McpPanel.vue';
import KnowledgeBasePanel from '@/components/panel/KnowledgeBasePanel.vue';
import CreateCredentialDialog from '@/components/dialog/CreateCredentialDialog.vue';
import { useAvailableModels } from '@/composables/useAvailableModels';
import { useKnowledgeBases } from '@/composables/useKnowledgeBases';
import { useMessages } from '@/composables/useMessages';
import { useSessions } from '@/composables/useSessions';
import { useWorkspace } from '@/composables/useWorkspace';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  agentId: string | null;
  sessionId: string | null;
  onTeamUpdated?: () => void;
}>();

const { t } = useTranslation();
const { groups } = useAvailableModels();

// Convert props to refs for composables
const agentIdRef = ref<string | null>(props.agentId);
watch(() => props.agentId, (v) => { agentIdRef.value = v; });
const sessionIdRef = ref<string | null>(props.sessionId);
watch(() => props.sessionId, (v) => { sessionIdRef.value = v; });

const { sessions, refetch: refetchSessions } = useSessions(agentIdRef as any);
const msgComposable = useMessages(agentIdRef, sessionIdRef as any);
const msgs = computed(() => msgComposable.msgs.value as any);
const streaming = computed(() => msgComposable.streaming.value);
const subagentHitl = computed(() => msgComposable.subagentHitl.value);

const ws = useWorkspace(agentIdRef as any, sessionIdRef as any);
const mcpList = computed(() => ws.mcpClients.value as any);
const mcpListLoading = computed(() => ws.mcpLoading.value);
const skillList = computed(() => ws.skills.value as any);
const skillListLoading = computed(() => ws.skillLoading.value);

const { knowledgeBases, loading: knowledgeBasesLoading } = useKnowledgeBases();
const knowledgeBasesList = computed(() => knowledgeBases.value as any);

const selectedModel = ref<ChatModelConfig | null>(null);
const selectedFallbackModel = ref<ChatModelConfig | null>(null);
const selectedTTSModel = ref<TTSModelConfig | null>(null);
const selectedKnowledgeConfig = ref<SessionKnowledgeConfig | null>(null);
const selectedPermissionMode = ref('default');
const credentialOpen = ref(false);
const credentialRefetchTrigger = ref(0);
const tasksContext = ref<any>(null);
const permissionContext = ref<any>(null);
const panelLayout = ref<string[][]>([]);

function togglePanel(key: string) {
  const idx = panelLayout.value.findIndex((col) => col.includes(key));
  if (idx >= 0) {
    panelLayout.value = panelLayout.value.map((col) => col.filter((k) => k !== key)).filter((col) => col.length > 0);
  } else {
    const targetCol = panelLayout.value.findIndex((col) => col.length < 2);
    if (targetCol >= 0) {
      panelLayout.value = panelLayout.value.map((col, i) => i === targetCol ? [...col, key] : col);
    } else {
      panelLayout.value = [...panelLayout.value, [key]];
    }
  }
}

function closePanel(key: string) {
  panelLayout.value = panelLayout.value.map((col) => col.filter((k) => k !== key)).filter((col) => col.length > 0);
}

function panelLabel(key: string): string {
  const labels: Record<string, string> = {
    plan: t('panel.plan.title'),
    skill: t('panel.skill.title'),
    permission: t('panel.permission.title'),
    knowledge: t('panel.knowledge.title'),
    mcp: 'MCP',
  };
  return labels[key] || key;
}

const view = computed(() => sessions.value.find((v) => v.session.id === props.sessionId) ?? null);

watch(() => props.sessionId, () => {
  selectedModel.value = null;
  selectedFallbackModel.value = null;
  selectedTTSModel.value = null;
  selectedKnowledgeConfig.value = null;
});

watch(view, (v) => {
  if (!v) return;
  const sm = (v.session as any).config?.chat_model_config;
  if (sm) selectedModel.value = sm;
  selectedFallbackModel.value = (v.session as any).config?.fallback_chat_model_config ?? null;
  selectedTTSModel.value = (v.session as any).config?.tts_model_config ?? null;
  selectedKnowledgeConfig.value = (v.session as any).config?.knowledge_config ?? null;
  const mode = ((v.session as any).state?.permission_context as any)?.mode;
  if (mode) selectedPermissionMode.value = mode;
}, { immediate: true });

// Auto-populate model when session has no model (matching React behavior)
watch([() => props.sessionId, view, groups], () => {
  if (!props.sessionId) return;
  const v = view.value;
  if (v?.session?.config?.chat_model_config) return;
  const keys = Object.keys(groups.value);
  if (!keys.length) return;
  const firstGroup = groups.value[keys[0]];
  if (!firstGroup?.length) return;
  const firstItem = firstGroup[0];
  if (!firstItem?.models?.length) return;
  handleLlmChange({
    type: keys[0],
    credential_id: firstItem.credential.id,
    model: firstItem.models[0].name,
    parameters: {},
  });
}, { immediate: true });

const selectedModelCard = computed(() => {
  if (!selectedModel.value) return null;
  const items = groups.value[selectedModel.value.type];
  if (!items) return null;
  for (const item of items) {
    const card = (item.models as any[]).find((m: any) => m.name === selectedModel.value?.model);
    if (card) return card;
  }
  return null;
});

const allowedInputTypes = computed(() => {
  return ((selectedModelCard.value as any)?.input_types ?? []).filter(
    (t: string) =>
      /^(image|video|audio|text)\/.+/.test(t) ||
      t === 'application/pdf' ||
      t.startsWith('application/vnd.') ||
      t.startsWith('application/msword') ||
      t.startsWith('application/vnd.openxmlformats'),
  );
});

const fileProcessor = async (file: File) => {
  const filePath = (file as any).path;
  if (filePath) {
    return { id: crypto.randomUUID(), type: 'data' as const, source: { type: 'url' as const, url: `file://${filePath}`, media_type: file.type || 'application/octet-stream' }, name: file.name };
  }
  if (file.type === 'text/plain') {
    const text = await file.text();
    return { id: crypto.randomUUID(), type: 'text' as const, text: `[File: ${file.name}]\n${text}` };
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return { id: crypto.randomUUID(), type: 'data' as const, source: { type: 'base64' as const, media_type: file.type || 'application/octet-stream', data: base64 }, name: file.name };
};

async function sendMsg(blocks: ContentBlock[]) {
  if (blocks.length === 0) return;
  const msg = UserMsg({ name: 'user', content: blocks });
  await msgComposable.send(msg as any);
}

function handleUserConfirm(toolCall: ToolCallBlock, confirm: boolean, replyId: string, rules?: any) {
  msgComposable.onUserConfirm(toolCall, confirm, replyId, rules);
}

function handleSubagentConfirm(entry: any, toolCall: any, confirm: boolean, rules?: any) {
  msgComposable.onUserConfirm(toolCall, confirm, entry.reply_id || entry.id, rules);
}

async function addSkill(skill: any) {
  try { await ws.addSkill(skill); } catch { ElMessage.error('Failed to add skill'); }
}

async function removeSkillItem(name: string) {
  try { await ws.removeSkill(name); } catch { ElMessage.error('Failed to remove skill'); }
}

async function addMcp(mcp: any) {
  try { await ws.addMcp(mcp); } catch { ElMessage.error('Failed to add MCP'); }
}

async function removeMcpItem(name: string) {
  try { await ws.removeMcp(name); } catch { ElMessage.error('Failed to remove MCP'); }
}

const handleLlmChange = async (config: ChatModelConfig | null) => {
  if (!config || !props.sessionId || !props.agentId) return;
  selectedModel.value = config;
  try {
    await sessionApi.update(props.sessionId, props.agentId, { chat_model_config: config });
    await refetchSessions();
  } catch { /* handled by client */ }
};

const handleParametersChange = async (params: Record<string, unknown>) => {
  if (!selectedModel.value || !props.sessionId || !props.agentId) return;
  const updated = { ...selectedModel.value, parameters: params };
  selectedModel.value = updated;
  try {
    await sessionApi.update(props.sessionId, props.agentId, { chat_model_config: updated });
    await refetchSessions();
  } catch { /* handled by client */ }
};

const handleFallbackChange = async (config: ChatModelConfig | null) => {
  if (!props.sessionId || !props.agentId) return;
  selectedFallbackModel.value = config;
  try {
    await sessionApi.update(props.sessionId, props.agentId, { fallback_chat_model_config: config });
    await refetchSessions();
  } catch { /* handled by client */ }
};

const handleTTSChange = async (config: TTSModelConfig | null) => {
  if (!props.sessionId || !props.agentId) return;
  selectedTTSModel.value = config;
  try {
    await sessionApi.update(props.sessionId, props.agentId, { tts_model_config: config });
    await refetchSessions();
  } catch { /* handled by client */ }
};

const handlePermissionModeChange = async (mode: string) => {
  selectedPermissionMode.value = mode;
  if (!props.sessionId || !props.agentId) return;
  try {
    await sessionApi.update(props.sessionId, props.agentId, { permission_mode: mode as any });
    await refetchSessions();
  } catch { /* handled by client */ }
};

const handleKnowledgeConfigChange = async (config: SessionKnowledgeConfig | null) => {
  if (!props.sessionId || !props.agentId) return;
  selectedKnowledgeConfig.value = config;
  try {
    await sessionApi.update(props.sessionId, props.agentId, { knowledge_config: config });
    await refetchSessions();
  } catch { /* handled by client */ }
};
</script>
