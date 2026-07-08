<template>
  <div v-if="entry && toolCalls.length > 0" class="rounded-[10px] border border-border/80 bg-card p-3 space-y-3">
    <div class="flex items-center gap-2 px-1 text-sm">
      <svg class="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <span class="text-xs font-medium text-foreground">{{ t('chat.subagentConfirmTitle', { name: entry.worker_agent_name }) }}</span>
    </div>
    <div class="space-y-2">
      <ConfirmCard
        v-for="toolCall in toolCalls"
        :key="toolCall.id"
        :tool-call="toolCall"
        :on-user-confirm="(confirm, rules) => onConfirm(toolCall, confirm, rules)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ToolCallBlock } from '@agentscope-ai/agentscope/message';
import ConfirmCard from './ConfirmCard.vue';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  entry: Record<string, any>;
  onConfirm: (toolCall: ToolCallBlock, confirm: boolean, rules?: ToolCallBlock['suggested_rules']) => void;
}>();

const { t } = useTranslation();
const toolCalls = computed(() => (props.entry?.tool_calls ?? props.entry?.event?.tool_calls ?? []) as ToolCallBlock[]);
</script>
