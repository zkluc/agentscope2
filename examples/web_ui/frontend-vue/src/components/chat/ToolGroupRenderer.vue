<template>
  <component :is="renderWrapper" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from '@/i18n/useI18n';
import { renderToolGroup } from './tool-renderers';
import type { ToolCallWithResult } from './tool-renderers/types';

const props = defineProps<{
  toolName: string;
  calls: ToolCallWithResult[];
}>();

const { t } = useTranslation();

const renderWrapper = computed(() => ({
  render: () => renderToolGroup(props.toolName, props.calls, t),
}));
</script>
