<template>
  <ElDialog :model-value="open" :width="500" @update:model-value="$emit('update:open', $event)" top="5vh">
    <template #header>
      <h3 class="text-lg font-semibold">{{ t('dialog-agent-edit.title') }}</h3>
    </template>
    <div class="-mx-4 max-h-[75vh] overflow-y-auto px-4">
      <AgentFormFields v-if="schema && formValues" :schema="schema as any" :values="formValues" />
      <p v-else class="text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    </div>
    <template #footer>
      <ElButton @click="$emit('update:open', false)" :disabled="submitting">
        <CircleAlert class="size-3.5 mr-1" />{{ t('common.cancel') }}
      </ElButton>
      <ElButton type="primary" @click="handleSubmit" :disabled="!nameValid || submitting || !schema || !formValues">
        <ElIcon class="mr-1">
          <Loader2 v-if="submitting" class="animate-spin" />
          <Save v-else />
        </ElIcon>
        {{ submitting ? t('common.saving') : t('common.save') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElDialog, ElButton, ElIcon } from 'element-plus';
import { CircleAlert, Loader2, Save } from 'lucide-vue-next';
import { useAgents } from '@/composables/useAgents';
import { useAgentSchema } from '@/composables/useAgentSchema';
import { useTranslation } from '@/i18n/useI18n';
import AgentFormFields from '@/components/form/AgentFormFields.vue';
import { defaultAgentFormValues } from '@/components/form/AgentFormFields';
import type { AgentFormValues } from '@/components/form/AgentFormFields';
import type { AgentRecord, ContextConfig, ReActConfig } from '@/api';

const props = defineProps<{
  open: boolean;
  agent: AgentRecord | null;
  onUpdated?: () => void;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const { update } = useAgents();
const { schema } = useAgentSchema();
const submitting = ref(false);
const formValues = ref<AgentFormValues | null>(null);

watch(() => props.open, (val) => {
  if (!val || !schema.value || !props.agent) {
    if (!val) formValues.value = null;
    return;
  }
  const base = defaultAgentFormValues(schema.value as any);
  const d = props.agent.data;
  formValues.value = {
    identity: {
      ...base.identity,
      name: d.name,
      system_prompt: d.system_prompt,
    },
    context_config: { ...base.context_config, ...(d.context_config ?? {}) },
    react_config: { ...base.react_config, ...(d.react_config ?? {}) },
  };
});

const nameValid = computed(() => {
  const name = formValues.value?.identity?.name as string | undefined;
  return !!(name?.trim());
});

async function handleSubmit() {
  if (!formValues.value || !props.agent) return;
  const name = (formValues.value.identity.name as string | undefined)?.trim();
  if (!name) return;
  submitting.value = true;
  try {
    await update(props.agent.id, {
      name,
      system_prompt: formValues.value.identity.system_prompt as string | undefined,
      context_config: formValues.value.context_config as unknown as ContextConfig,
      react_config: formValues.value.react_config as unknown as ReActConfig,
    });
    emit('update:open', false);
    props.onUpdated?.();
  } finally {
    submitting.value = false;
  }
}
</script>
