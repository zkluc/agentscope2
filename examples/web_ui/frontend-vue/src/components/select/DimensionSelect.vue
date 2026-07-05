<template>
  <ElSelect
    :model-value="modelValue"
    :placeholder="t('kb.dimensions.placeholder')"
    size="small"
    class="w-full"
    @change="$emit('update:modelValue', $event)"
  >
    <ElOption
      v-for="d in dimensions"
      :key="d"
      :label="`${d}`"
      :value="d"
    />
  </ElSelect>
</template>

<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus';
import { useTranslation } from '@/i18n/useI18n';

defineProps<{
  modelValue: number | null;
  dimensions: number[];
}>();

defineEmits<{
  'update:modelValue': [value: number];
}>();

const { t } = useTranslation();
</script>
