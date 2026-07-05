<template>
  <div v-if="tasksContext" class="text-sm">
    <p class="text-muted-foreground">{{ t('panel.plan.description') }}</p>
    <div class="mt-2 space-y-1">
      <div v-for="(task, i) in tasks" :key="i" class="flex items-center gap-2">
        <span :class="['size-2 rounded-full', task.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500']" />
        <span>{{ task.name }}</span>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-muted-foreground">
    <p>{{ t('panel.plan.empty') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  tasksContext: Record<string, any> | null;
}>();

const { t } = useTranslation();
const tasks = computed(() => {
  if (!props.tasksContext) return [];
  const raw = (props.tasksContext as any).tasks || [];
  return Array.isArray(raw) ? raw : [];
});
</script>
