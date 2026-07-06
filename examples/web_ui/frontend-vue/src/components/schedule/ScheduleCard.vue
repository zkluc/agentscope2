<template>
  <div class="group flex items-center gap-4 rounded-xl border bg-card p-4 cursor-pointer hover:shadow-sm transition-all duration-150" @click="$emit('click')">
    <div
      class="size-9 rounded-lg shrink-0 flex items-center justify-center"
      :class="schedule.data.enabled ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'"
    >
      <Bot v-if="schedule.data.enabled" class="size-4.5" />
      <BotOff v-else class="size-4.5" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium text-sm text-foreground truncate">{{ schedule.data.name }}</span>
        <ElTag v-if="!schedule.data.enabled" size="small" effect="plain" class="shrink-0">
          <Pause class="size-3 mr-0.5" />{{ t('common.disabled') }}
        </ElTag>
      </div>
      <div class="flex flex-wrap gap-x-3 items-center text-xs text-muted-foreground mt-1.5">
        <span class="inline-flex items-center gap-1">
          <CalendarDays class="size-3" />
          {{ formatDate(schedule.data.started_at) }}
          <span v-if="schedule.data.ended_at">— {{ formatDate(schedule.data.ended_at) }}</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <Clock class="size-3" />
          {{ parsed.time }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Repeat class="size-3" />
          {{ getFrequencyLabel(parsed, t) }}
        </span>
      </div>
    </div>
    <ChevronRight class="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElTag } from 'element-plus';
import { Bot, BotOff, Pause, CalendarDays, Clock, Repeat, ChevronRight } from 'lucide-vue-next';
import type { ScheduleRecord } from '@/api';
import { parseCronExpression, getFrequencyLabel } from './schedule-utils';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  schedule: ScheduleRecord;
}>();

defineEmits<{
  click: [];
}>();

const { t } = useTranslation();

const parsed = computed(() => parseCronExpression(props.schedule.data.cron_expression, props.schedule.data.started_at));

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}
</script>
