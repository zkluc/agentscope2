<template>
  <ElDrawer
    v-if="schedule"
    :model-value="open"
    :size="480"
    @update:model-value="$emit('update:open', $event)"
  >
    <template #header>
      <div>
        <h3 class="text-lg font-semibold">{{ schedule.data.name }}</h3>
        <p class="text-sm text-muted-foreground">{{ schedule.data.description }}</p>
      </div>
    </template>

    <div class="flex flex-col gap-y-4">
      <div>
        <h4 class="text-sm font-semibold mb-2">{{ t('common.information') }}</h4>
        <div class="flex flex-col gap-2">
          <div
            v-for="item in infoItems"
            :key="item.label"
            class="flex justify-between text-xs px-2.5 py-2 rounded-md ring-1 ring-border"
          >
            <span class="font-medium">{{ item.label.toUpperCase() }}</span>
            <span class="text-muted-foreground">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <div class="border-t" />

      <div class="flex-1 flex flex-col overflow-hidden">
        <h4 class="text-sm font-semibold mb-2">{{ t('schedule.executionHistory') }}</h4>
        <div class="flex-1 overflow-y-auto space-y-1">
          <div v-if="sessionsLoading" class="text-center py-4 text-muted-foreground text-sm">
            {{ t('common.loading') }}
          </div>
          <div v-else-if="sessions.length === 0" class="text-center py-4 text-muted-foreground text-sm">
            {{ t('common.noData') }}
          </div>
          <div
            v-for="session in sessions"
            :key="session.id"
            class="flex justify-between text-xs px-2.5 py-2 rounded-md ring-1 ring-border items-center cursor-pointer hover:bg-muted/50 transition-colors"
            @click="goToSession(session)"
          >
            <span class="text-muted-foreground">{{ formatDate(session.created_at) }}</span>
            <StatusBadge status="completed" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <ElButton type="danger" size="small" @click="deleteOpen = true">
          <Trash2 class="size-3 mr-1" />{{ t('common.delete') }}
        </ElButton>
        <ElButton @click="$emit('update:open', false)">{{ t('common.close') }}</ElButton>
      </div>
    </template>

    <ElDialog v-if="schedule" :model-value="deleteOpen" :width="400" @update:model-value="deleteOpen = $event">
      <h3 class="text-lg font-semibold">{{ t('common.deleteTitle', { name: `"${(schedule as any).data.name}"` }) }}</h3>
      <p class="text-sm text-muted-foreground mt-1">{{ t('common.deleteDescription') }}</p>
      <template #footer>
        <ElButton @click="deleteOpen = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="danger" @click="handleDelete">{{ t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElDrawer, ElButton, ElDialog } from 'element-plus';
import { Trash2 } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { scheduleApi } from '@/api';
import type { ScheduleRecord, SessionRecord } from '@/api';
import StatusBadge from '@/components/badge/StatusBadge.vue';
import { parseCronExpression, getFrequencyLabel } from './schedule-utils';
import { useAgents } from '@/composables/useAgents';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  open: boolean;
  schedule: ScheduleRecord | null;
  onDelete: (scheduleId: string) => Promise<void>;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const { agents } = useAgents();
const router = useRouter();
const deleteOpen = ref(false);
const sessions = ref<SessionRecord[]>([]);
const sessionsLoading = ref(false);

watch(() => [props.open, props.schedule], async ([open]) => {
  const s = props.schedule;
  if (!open || !s) {
    sessions.value = [];
    return;
  }
  sessionsLoading.value = true;
  try {
    const res = await scheduleApi.listSessions(s.id);
    sessions.value = res.sessions;
  } catch {
    sessions.value = [];
  } finally {
    sessionsLoading.value = false;
  }
}, { immediate: true });

const parsed = computed(() => {
  if (!props.schedule) return null;
  return parseCronExpression(props.schedule.data.cron_expression, props.schedule.data.started_at);
});

const infoItems = computed(() => {
  if (!props.schedule || !parsed.value) return [];
  const s = props.schedule.data;
  const p = parsed.value;
  const agentName = agents.value.find((a) => a.id === props.schedule!.agent_id)?.data.name ?? props.schedule!.agent_id;

  const weekdays = [
    t('schedule.sunday'),
    t('schedule.monday'),
    t('schedule.tuesday'),
    t('schedule.wednesday'),
    t('schedule.thursday'),
    t('schedule.friday'),
    t('schedule.saturday'),
  ];

  let triggerTime = p.time;
  if (p.frequency === 'weekly') {
    triggerTime = `${weekdays[p.weekday ?? 0]} ${p.time}`;
  } else if (p.frequency === 'monthly') {
    triggerTime = `${p.dayOfMonth ?? 1}${t('schedule.dayOfMonthSuffix')} ${p.time}`;
  } else if (p.frequency === 'once' && p.date) {
    triggerTime = `${p.date.toLocaleDateString()} ${p.time}`;
  }
  triggerTime += ` (${s.timezone})`;

  return [
    { label: t('schedule.frequency'), value: getFrequencyLabel(p, t) },
    { label: t('schedule.triggerTime'), value: triggerTime },
    { label: t('schedule.createdAt'), value: new Date(props.schedule!.created_at).toLocaleString() },
    { label: t('schedule.end_at'), value: s.ended_at ? new Date(s.ended_at).toLocaleString() : t('common.noData') },
    { label: t('common.agent'), value: agentName },
    { label: t('schedule.permissionMode'), value: s.permission_mode },
    { label: t('schedule.stateful'), value: s.stateful ? t('common.yes') : t('common.no') },
  ];
});

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

async function handleDelete() {
  if (!props.schedule) return;
  await props.onDelete(props.schedule.id);
  deleteOpen.value = false;
  emit('update:open', false);
}

function goToSession(session: SessionRecord) {
  if (!props.schedule) return;
  router.push(`/chat/${props.schedule.agent_id}/${session.id}`);
  emit('update:open', false);
}
</script>
