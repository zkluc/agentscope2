<template>
  <ElSelect
    :model-value="value"
    :disabled="disabled"
    size="small"
    class="min-w-32"
    @change="onChange"
  >
    <ElOption
      v-for="mode in modes"
      :key="mode.value"
      :label="mode.label"
      :value="mode.value"
    />
  </ElSelect>
</template>

<script setup lang="ts">
import { useTranslation } from '@/i18n/useI18n';
import { ElOption, ElSelect } from 'element-plus';

defineProps<{
  value: string;
  disabled?: boolean;
  onChange: (mode: string) => void;
}>();

const { t } = useTranslation();
const modes = [
  { value: 'default', label: t('permissionMode.default') },
  { value: 'explore', label: t('permissionMode.explore') },
  { value: 'bypass', label: t('permissionMode.bypass') },
  { value: 'dont_ask', label: t('permissionMode.dontAsk') },
];
</script>
