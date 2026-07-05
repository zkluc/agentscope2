<template>
  <div v-html="renderedHTML"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ToolCallWithResult } from './tool-renderers/types';

const props = defineProps<{
  toolName: string;
  calls: ToolCallWithResult[];
}>();

const renderedHTML = computed(() => {
  const name = props.toolName || 'Tool';
  const items = props.calls.map((item) => {
    const input = typeof item.call.input === 'string' ? item.call.input : '';
    return { input };
  });
  const status = props.calls.some((c) => c.result?.state === 'success') ? '&#10003;' : '&#8943;';
  const lines = items.map((item) => item.input).join(', ');
  return `<div class="flex items-center gap-2 text-sm text-muted-foreground"><span>${status}</span><span class="font-medium">${name}</span><span class="truncate">${lines}</span></div>`;
});
</script>
