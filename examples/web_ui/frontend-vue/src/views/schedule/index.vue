<template>
  <div class="flex-1 overflow-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">{{ t('schedule.title') }}</h1>
      <ElButton type="primary" @click="createOpen = true">
        <Plus class="size-4 mr-1" /> {{ t('schedule.create') }}
      </ElButton>
    </div>

    <ElTabs v-model="activeTab">
      <ElTabPane :label="t('schedule.listView')" name="list">
        <div v-if="loading" class="flex items-center justify-center h-32">
          <span class="text-muted-foreground">{{ t('common.loading') }}</span>
        </div>
        <template v-else>
          <div class="flex flex-row w-full pb-4">
            <ElDatePicker
              v-model="dateRange"
              type="daterange"
              :start-placeholder="t('schedule.startDate')"
              :end-placeholder="t('schedule.endDate')"
              size="small"
              class="w-64"
              @change="onDateRangeChange"
            />
          </div>
          <div v-if="filteredSchedules.length === 0" class="flex flex-col items-center py-16 text-muted-foreground">
            <Calendar class="size-8 mb-2" />
            <p>{{ t('schedule.noSchedules') }}</p>
            <p class="text-xs">{{ t('schedule.noSchedulesDescription') }}</p>
          </div>
          <div v-else class="space-y-3">
            <ScheduleCard
              v-for="schedule in filteredSchedules"
              :key="schedule.id"
              :schedule="schedule"
              @click="selectedSchedule = schedule; detailOpen = true"
            />
          </div>
        </template>
      </ElTabPane>

      <ElTabPane :label="t('schedule.calendarView')" name="calendar">
        <CalendarTabPage
          :events="calendarEvents"
          :current-date="calendarDate"
          @month-change="calendarDate = $event"
          @event-click="handleEventClick"
        />
      </ElTabPane>
    </ElTabs>

    <CreateScheduleDialog
      :open="createOpen"
      @update:open="createOpen = $event"
      :on-created="refetch"
    />

    <ScheduleDetailDrawer
      :open="detailOpen"
      :schedule="selectedSchedule"
      @update:open="detailOpen = $event"
      :on-delete="handleDeleteSchedule"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ElButton, ElTabs, ElTabPane, ElDatePicker, ElMessage, ElMessageBox,
} from 'element-plus';
import { Plus, Calendar } from 'lucide-vue-next';
import { useSchedules } from '@/composables/useSchedules';
import { useTranslation } from '@/i18n/useI18n';
import ScheduleCard from '@/components/schedule/ScheduleCard.vue';
import CalendarTabPage from '@/components/schedule/CalendarTabPage.vue';
import CreateScheduleDialog from '@/components/dialog/CreateScheduleDialog.vue';
import ScheduleDetailDrawer from '@/components/schedule/ScheduleDetailDrawer.vue';
import { parseCronExpression } from '@/components/schedule/schedule-utils';
import type { ScheduleRecord } from '@/api';
import type { ScheduleEvent } from '@/components/schedule/schedule-utils';
import { CronExpressionParser } from 'cron-parser';

const { t } = useTranslation();
const { schedules, loading, refetch, remove } = useSchedules();

const activeTab = ref('list');
const createOpen = ref(false);
const detailOpen = ref(false);
const selectedSchedule = ref<ScheduleRecord | null>(null);
const calendarDate = ref(new Date());
const dateRange = ref<[Date, Date] | null>(null);

function onDateRangeChange(range: [Date, Date] | null) {
  dateRange.value = range;
}

const filteredSchedules = computed(() => {
  if (!dateRange.value) return schedules.value as ScheduleRecord[];
  const [start, end] = dateRange.value;
  return (schedules.value as ScheduleRecord[]).filter((s) =>
    scheduleHasOccurrencesInRange(s, start, end)
  );
});

function scheduleHasOccurrencesInRange(schedule: ScheduleRecord, rangeStart: Date, rangeEnd: Date): boolean {
  const { data } = schedule;
  try {
    const interval = CronExpressionParser.parse(data.cron_expression, {
      currentDate: rangeStart,
      endDate: rangeEnd,
    } as any);
    const startTs = new Date(data.started_at).getTime();
    const endTs = data.ended_at ? new Date(data.ended_at).getTime() : null;

    while (interval.hasNext()) {
      const date = interval.next().toDate();
      const ts = date.getTime();
      if (ts < startTs) continue;
      if (endTs && ts > endTs) break;
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

const calendarEvents = computed(() => {
  return (schedules.value as ScheduleRecord[]).flatMap((s) => {
    try {
      const interval = CronExpressionParser.parse(s.data.cron_expression, {
        currentDate: new Date(calendarDate.value.getFullYear(), calendarDate.value.getMonth(), 1),
        endDate: new Date(calendarDate.value.getFullYear(), calendarDate.value.getMonth() + 1, 0),
      } as any);
      const events: ScheduleEvent[] = [];
      const startTs = new Date(s.data.started_at).getTime();
      const endTs = s.data.ended_at ? new Date(s.data.ended_at).getTime() : null;
      let count = 0;

      while (interval.hasNext() && count < 31) {
        const date = interval.next().toDate();
        const ts = date.getTime();
        if (ts < startTs) continue;
        if (endTs && ts > endTs) break;

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const p = parseCronExpression(s.data.cron_expression, s.data.started_at);

        events.push({
          id: `${s.id}-${count}`,
          title: s.data.name,
          date: `${y}-${m}-${d}`,
          time: p.time,
          content: s.data.description,
        });
        count++;
      }
      return events;
    } catch {
      return [];
    }
  });
});

function handleEventClick(event: ScheduleEvent) {
  const schedule = (schedules.value as ScheduleRecord[]).find((s) =>
    event.id.startsWith(s.id)
  );
  if (schedule) {
    selectedSchedule.value = schedule;
    detailOpen.value = true;
  }
}

async function handleDeleteSchedule(scheduleId: string) {
  try {
    await ElMessageBox.confirm(t('schedule.deleteConfirm'), t('common.confirm'), { type: 'warning' });
    await remove(scheduleId);
    ElMessage.success(t('schedule.deleteSuccess'));
  } catch {
    // cancelled
  }
}
</script>
