<template>
  <ElDialog :model-value="open" :width="520" @update:model-value="$emit('update:open', $event)" top="5vh">
    <template #header>
      <h3 class="text-lg font-semibold">{{ t('schedule.createSchedule.title') }}</h3>
      <p class="text-sm text-muted-foreground mt-1">{{ t('schedule.createSchedule.description') }}</p>
    </template>

    <div class="-mx-4 max-h-[75vh] overflow-y-auto px-4">
      <ElForm label-position="top">
        <ElFormItem :label="t('common.name')" required>
          <ElInput v-model="form.name" :placeholder="t('schedule.createSchedule.namePlaceholder')" size="small" />
        </ElFormItem>

        <ElFormItem :label="t('schedule.createSchedule.descriptionLabel')">
          <ElInput v-model="form.description" type="textarea" :rows="3" :placeholder="t('schedule.createSchedule.descriptionPlaceholder')" />
        </ElFormItem>

        <div class="flex gap-3">
          <ElFormItem :label="t('common.date')" class="flex-1">
            <ElDatePicker
              v-model="form.date"
              type="date"
              :placeholder="t('schedule.pickDate')"
              size="small"
              class="w-full"
              value-format="timestamp"
            />
          </ElFormItem>
          <ElFormItem :label="t('common.time')" class="w-48">
            <ElTimePicker
              v-model="form.time"
              :placeholder="t('schedule.pickTime')"
              size="small"
              class="w-full"
              format="HH:mm"
            />
          </ElFormItem>
        </div>

        <ElFormItem :label="t('schedule.timezone')">
          <TimezoneSelect
            :model-value="form.timezone"
            @update:model-value="(v: string) => form.timezone = v"
          />
        </ElFormItem>

        <ElFormItem :label="t('schedule.frequency')">
          <ElSelect v-model="form.freq" size="small">
            <ElOption label="Once" value="once" />
            <ElOption label="Daily" value="daily" />
            <ElOption label="Weekly" value="weekly" />
            <ElOption label="Monthly" value="monthly" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem :label="t('schedule.endAt')">
          <ElDatePicker
            v-model="form.endDate"
            type="date"
            :placeholder="t('schedule.pickDate')"
            size="small"
            class="w-full"
            value-format="timestamp"
            :disabled="form.freq === 'once'"
          />
        </ElFormItem>

        <ElFormItem :label="t('common.agent')" required>
          <ElSelect v-model="form.agentId" size="small" :placeholder="t('common.selectAgent')">
            <ElOption
              v-for="agent in agents"
              :key="agent.id"
              :label="agent.data.name"
              :value="agent.id"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem :label="t('common.model')" required>
          <LlmSelect
            :value="form.chatModelConfig"
            :on-change="(v: any) => form.chatModelConfig = v"
            :on-add-credential="() => {}"
            :refetch-trigger="0"
          />
        </ElFormItem>

        <ElFormItem :label="t('schedule.permissionMode')">
          <PermissionModeSelect
            :value="form.permissionMode"
            @change="(v: string) => form.permissionMode = v as any"
            :disabled="false"
          />
        </ElFormItem>

        <ElFormItem>
          <div class="flex items-center justify-between w-full">
            <div>
              <span class="text-sm">{{ t('schedule.stateful') }}</span>
              <p class="text-xs text-muted-foreground">{{ t('schedule.statefulDesc') }}</p>
            </div>
            <ElSwitch v-model="form.stateful" />
          </div>
        </ElFormItem>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="$emit('update:open', false)" :disabled="loading">
        <CircleAlert class="size-3.5 mr-1" />{{ t('common.cancel') }}
      </ElButton>
      <ElButton type="primary" @click="handleSubmit" :disabled="loading || !isValid">
        <ElIcon class="mr-1">
          <Loader2 v-if="loading" class="animate-spin" />
          <PlusCircle v-else />
        </ElIcon>
        {{ loading ? t('common.creating') : t('common.create') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { ElDialog, ElButton, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElDatePicker, ElTimePicker, ElSwitch, ElIcon } from 'element-plus';
import { CircleAlert, Loader2, PlusCircle } from 'lucide-vue-next';
import { useSchedules } from '@/composables/useSchedules';
import { useAgents } from '@/composables/useAgents';
import { useTranslation } from '@/i18n/useI18n';
import LlmSelect from '@/components/select/LlmSelect.vue';
import PermissionModeSelect from '@/components/select/PermissionModeSelect.vue';
import TimezoneSelect from '@/components/select/TimezoneSelect.vue';
import type { ChatModelConfig, PermissionMode } from '@/api';

const props = defineProps<{
  open: boolean;
  onCreated?: () => void;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const { create } = useSchedules();
const { agents } = useAgents();
const loading = ref(false);
const error = ref('');

const form = reactive({
  name: '',
  description: '',
  freq: 'daily' as 'once' | 'daily' | 'weekly' | 'monthly',
  date: Date.now(),
  time: new Date(),
  endDate: null as number | null,
  agentId: '',
  chatModelConfig: null as ChatModelConfig | null,
  permissionMode: 'dont_ask' as PermissionMode,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  stateful: false,
});

watch(() => props.open, (val) => {
  if (val) {
    form.name = '';
    form.description = '';
    form.freq = 'daily';
    form.date = Date.now();
    form.time = new Date();
    form.endDate = null;
    form.agentId = agents.value[0]?.id ?? '';
    form.chatModelConfig = null;
    form.permissionMode = 'dont_ask';
    form.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    form.stateful = false;
    error.value = '';
  }
});

watch(() => agents.value, (val) => {
  if (val.length > 0 && !form.agentId) {
    form.agentId = val[0].id;
  }
}, { immediate: true });

const isValid = computed(() =>
  form.name.trim() && !!form.date && !!form.agentId && !!form.chatModelConfig
);

function buildCronExpr(): string {
  const date = new Date(form.date);
  const hours = form.time.getHours();
  const minutes = form.time.getMinutes();

  switch (form.freq) {
    case 'daily':
      return `${minutes} ${hours} * * *`;
    case 'weekly': {
      const weekday = date.getDay();
      return `${minutes} ${hours} * * ${weekday}`;
    }
    case 'monthly': {
      const monthDay = date.getDate();
      return `${minutes} ${hours} ${monthDay} * *`;
    }
    case 'once': {
      return `${minutes} ${hours} ${date.getDate()} ${date.getMonth() + 1} *`;
    }
    default:
      return '';
  }
}

async function handleSubmit() {
  if (!isValid.value) return;
  error.value = '';
  loading.value = true;
  try {
    const cronExpression = buildCronExpr();
    await create({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      cron_expression: cronExpression,
      timezone: form.timezone,
      agent_id: form.agentId,
      chat_model_config: form.chatModelConfig!,
      enabled: true,
      stateful: form.stateful,
      permission_mode: form.permissionMode,
    });
    props.onCreated?.();
    emit('update:open', false);
  } catch (e) {
    error.value = String(e);
  } finally {
    loading.value = false;
  }
}
</script>
