<template>
  <ElSelect
    :model-value="modelValue"
    :placeholder="t('schedule.timezone.placeholder')"
    size="small"
    class="w-full"
    filterable
    @change="$emit('update:modelValue', $event)"
  >
    <ElOption
      v-for="tz in timezones"
      :key="tz"
      :label="tz"
      :value="tz"
    />
  </ElSelect>
</template>

<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus';
import { useTranslation } from '@/i18n/useI18n';

defineProps<{
  modelValue: string | null;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useTranslation();

const timezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Moscow',
  'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore', 'Asia/Hong_Kong',
  'Australia/Sydney', 'Pacific/Auckland',
];
</script>
