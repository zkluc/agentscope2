<template>
  <div class="tour-card">
    <div class="w-80 shadow-lg rounded-lg border bg-card text-card-foreground">
      <div class="flex flex-row items-start justify-between gap-2 p-4 pb-0">
        <h4 class="font-medium text-sm">{{ title }}</h4>
        <button class="text-muted-foreground hover:text-foreground -mt-1" @click="$emit('close')">
          <X class="size-4" />
        </button>
      </div>
      <div class="p-4 text-muted-foreground text-sm leading-relaxed">
        {{ content }}
      </div>
      <div class="flex items-center justify-between p-4 pt-0">
        <span class="text-muted-foreground text-xs">{{ currentStep + 1 }} / {{ totalSteps }}</span>
        <div class="flex items-center gap-2">
          <ElButton v-if="currentStep > 0" size="small" text @click="$emit('prev')">{{ t('tour.prev') }}</ElButton>
          <ElButton size="small" @click="handleNext">{{ isLast ? t('tour.finish') : t('tour.next') }}</ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElButton } from 'element-plus';
import { X } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  title: string;
  content: string;
  currentStep: number;
  totalSteps: number;
}>();

const emit = defineEmits<{
  next: [];
  prev: [];
  close: [];
}>();

const { t } = useTranslation();
const isLast = computed(() => props.currentStep === props.totalSteps - 1);

function handleNext() {
  if (isLast.value) {
    localStorage.setItem('chat_tour_done', '1');
    emit('close');
  } else {
    emit('next');
  }
}
</script>
