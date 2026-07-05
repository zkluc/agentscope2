<template>
  <div v-if="toolCalls.length > 0" class="ring ring-border rounded-xl w-full p-3 space-y-3 bg-secondary/30">
    <div class="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
      <Users class="size-4 shrink-0" />
      <span>{{ t('chat.subagentConfirmTitle', { name: entry.worker_agent_name }) }}</span>
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
import { Users } from 'lucide-vue-next';
import type { ToolCallBlock } from '@agentscope-ai/agentscope/message';
import ConfirmCard from './ConfirmCard.vue';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  entry: Record<string, any>;
  onConfirm: (toolCall: ToolCallBlock, confirm: boolean, rules?: ToolCallBlock['suggested_rules']) => void;
}>();

const { t } = useTranslation();
const toolCalls = computed(() => (props.entry.event?.tool_calls ?? []) as ToolCallBlock[]);
</script>
