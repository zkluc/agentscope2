<template>
  <ElTag v-if="status === 'running'" size="small" type="warning">
    <ElIcon class="mr-1"><Loader2 class="animate-spin" /></ElIcon>
    {{ t('common.running') }}
  </ElTag>
  <ElTag v-else-if="status === 'completed'" size="small" color="#f0fdf4" class="text-green-700 dark:bg-green-950 dark:text-green-300 border-0">
    <ElIcon class="mr-1"><CircleCheck /></ElIcon>
    {{ t('common.completed') }}
  </ElTag>
  <ElTag v-else-if="status === 'failed'" size="small" color="#fef2f2" class="text-red-700 dark:bg-red-950 dark:text-red-300 border-0">
    <ElIcon class="mr-1"><CircleX /></ElIcon>
    {{ t('common.failed') }}
  </ElTag>
</template>

<script setup lang="ts">
import { ElTag, ElIcon } from 'element-plus';
import { Loader2, CircleCheck, CircleX } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

defineProps<{
  status: 'running' | 'completed' | 'failed';
}>();

const { t } = useTranslation();
</script>
