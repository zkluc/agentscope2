<template>
  <div class="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow" @click="$emit('click')">
    <ElIcon :size="20">
      <Bot v-if="schedule.data.enabled" />
      <BotOff v-else />
    </ElIcon>
    <div class="flex-1 min-w-0">
      <div class="font-[550] truncate">{{ schedule.data.name }}</div>
      <div class="flex gap-x-2 items-center text-xs mt-1">
        <ElTag v-if="!schedule.data.enabled" size="small" type="info">
          <Pause class="h-3 w-3 mr-1" />{{ t('common.disabled') }}
        </ElTag>
        <span class="text-muted-foreground">
          <Calendar class="size-3 inline mr-1" />
          {{ formatDate(schedule.data.started_at) }}
          <ArrowRight v-if="schedule.data.ended_at" class="size-3 inline mx-1" />
          {{ schedule.data.ended_at ? formatDate(schedule.data.ended_at) : '' }}
          {{ parsed.time }}
        </span>
        <span class="text-muted-foreground">
          <ClipboardClock class="size-3 inline mr-1" />
          {{ getFrequencyLabel(parsed, t) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElIcon, ElTag } from 'element-plus';
import { Bot, BotOff, Pause, Calendar, ArrowRight, ClipboardClock } from 'lucide-vue-next';
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
