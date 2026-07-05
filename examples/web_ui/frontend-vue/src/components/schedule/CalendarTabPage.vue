<template>
  <div class="flex flex-col size-full">
    <div class="flex items-center justify-between p-4">
      <h2 class="text-xl font-semibold">{{ currentMonthLabel }}</h2>
      <div class="flex items-center gap-2">
        <ElButton size="small" @click="goToToday">{{ t('schedule.today') }}</ElButton>
        <ElButton size="small" text @click="goToPrevYear">
          <ChevronsLeft class="h-4 w-4" />
        </ElButton>
        <ElButton size="small" text @click="goToPrevMonth">
          <ChevronLeft class="h-4 w-4" />
        </ElButton>
        <ElButton size="small" text @click="goToNextMonth">
          <ChevronRight class="h-4 w-4" />
        </ElButton>
        <ElButton size="small" text @click="goToNextYear">
          <ChevronsRight class="h-4 w-4" />
        </ElButton>
      </div>
    </div>

    <div class="flex-1 flex flex-col">
      <div class="grid grid-cols-7 border-b">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-center py-2 text-sm font-medium text-muted-foreground"
        >
          {{ day }}
        </div>
      </div>

      <div class="flex-1 grid grid-cols-7" :style="{ gridTemplateRows: `repeat(${weeksNeeded}, minmax(0, 1fr))` }">
        <div
          v-for="day in prevMonthDays"
          :key="`prev-${day}`"
          class="border-r border-b p-2 text-muted-foreground/50"
        >
          <div class="text-sm">{{ day }}</div>
        </div>

        <div
          v-for="day in currentMonthDays"
          :key="`current-${day}`"
          class="border-r border-b p-2 hover:bg-accent cursor-pointer overflow-hidden"
          @click="onDayClick(year, month, day)"
        >
          <div class="flex items-start justify-between mb-1">
            <div
              :class="[
                'w-6 h-6 flex items-center justify-center text-sm',
                isToday(year, month, day) ? 'bg-primary text-primary-foreground rounded-full' : ''
              ]"
            >
              {{ day }}
            </div>
          </div>
          <div class="space-y-1">
            <div
              v-for="event in getEventsForDate(year, month, day).slice(0, 2)"
              :key="event.id"
              class="flex text-xs py-0.5 px-1 rounded-sm cursor-pointer hover:bg-primary/20 truncate"
              :title="`${event.time} - ${event.title}`"
              @click.stop="emit('eventClick', event)"
            >
              <div class="w-1 h-full bg-primary rounded mr-1 shrink-0" />
              <span class="truncate">{{ event.title }}</span>
            </div>
            <div
              v-if="getEventsForDate(year, month, day).length > 2"
              class="text-xs text-muted-foreground px-1 cursor-pointer hover:text-foreground hover:underline"
              @click.stop="emit('eventClick', getEventsForDate(year, month, day)[2])"
            >
              +{{ getEventsForDate(year, month, day).length - 2 }} {{ t('schedule.more') }}
            </div>
          </div>
        </div>

        <div
          v-for="(day, index) in nextMonthDays"
          :key="`next-${index}`"
          class="border-r border-b p-2 text-muted-foreground/50"
        >
          <div class="text-sm">{{ day }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElButton } from 'element-plus';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';
import type { ScheduleEvent } from './schedule-utils';

const props = defineProps<{
  events: ScheduleEvent[];
  currentDate: Date;
}>();

const emit = defineEmits<{
  monthChange: [date: Date];
  eventClick: [event: ScheduleEvent];
}>();

const { t } = useTranslation();

const year = computed(() => props.currentDate.getFullYear());
const month = computed(() => props.currentDate.getMonth());

const weekDays = computed(() => [
  t('schedule.sunday'),
  t('schedule.monday'),
  t('schedule.tuesday'),
  t('schedule.wednesday'),
  t('schedule.thursday'),
  t('schedule.friday'),
  t('schedule.saturday'),
]);

const currentMonthLabel = computed(() => {
  return new Date(year.value, month.value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
});

const firstDayOfWeek = computed(() => new Date(year.value, month.value, 1).getDay());
const lastDayInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate());
const prevMonthLastDay = computed(() => new Date(year.value, month.value, 0).getDate());

const prevMonthDays = computed(() =>
  Array.from({ length: firstDayOfWeek.value }, (_, i) => prevMonthLastDay.value - firstDayOfWeek.value + i + 1)
);

const currentMonthDays = computed(() =>
  Array.from({ length: lastDayInMonth.value }, (_, i) => i + 1)
);

const totalCells = computed(() => prevMonthDays.value.length + currentMonthDays.value.length);
const weeksNeeded = computed(() => Math.ceil(totalCells.value / 7));
const nextMonthDays = computed(() => {
  const total = weeksNeeded.value * 7;
  const remaining = total - prevMonthDays.value.length - currentMonthDays.value.length;
  return Array.from({ length: remaining }, (_, i) => i + 1);
});

function getEventsForDate(y: number, m: number, d: number): ScheduleEvent[] {
  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return props.events.filter((event) => event.date === dateStr);
}

function isToday(y: number, m: number, d: number): boolean {
  const today = new Date();
  return d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
}

function goToPrevMonth() { emit('monthChange', new Date(year.value, month.value - 1, 1)); }
function goToNextMonth() { emit('monthChange', new Date(year.value, month.value + 1, 1)); }
function goToPrevYear() { emit('monthChange', new Date(year.value - 1, month.value, 1)); }
function goToNextYear() { emit('monthChange', new Date(year.value + 1, month.value, 1)); }
function goToToday() { emit('monthChange', new Date()); }
function onDayClick(_y: number, _m: number, _d: number) {
  // Could emit an event to create schedule on this day
}
</script>
