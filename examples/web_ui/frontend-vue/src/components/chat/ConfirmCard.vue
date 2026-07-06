<template>
  <div class="rounded-xl border bg-card shadow-xs p-4 space-y-3 text-sm">
    <div class="flex items-start gap-3">
      <div class="mt-0.5 size-6 rounded-md bg-primary/5 flex items-center justify-center shrink-0">
        <Wrench class="size-3.5 text-primary" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-medium text-foreground text-xs">{{ displayName }}</div>
        <div class="mt-1.5 rounded-lg bg-muted/50 p-2.5">
          <code class="text-[11px] font-mono whitespace-pre-wrap break-all text-muted-foreground leading-relaxed">{{ toolCall.input }}</code>
        </div>
      </div>
    </div>
    <div class="border-t pt-2">
      <p class="text-[11px] font-medium text-muted-foreground mb-2">{{ t('chat.confirmToolCall') }}</p>
      <div class="space-y-1">
        <button
          class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors"
          :class="selected === 'yes' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
          @click="handleConfirm(true)"
          @mouseenter="selected = 'yes'"
        >
          <ChevronRight class="size-3" :class="selected === 'yes' ? 'opacity-100' : 'opacity-0'" />
          {{ t('common.yes') }}
        </button>
        <button
          v-if="hasSuggestedRules"
          class="flex items-start gap-2 w-full px-2 py-1.5 rounded-md text-xs text-left transition-colors"
          :class="selected === 'yes_with_rule' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
          @click="handleConfirm(true, [toolCall.suggested_rules![0]])"
          @mouseenter="selected = 'yes_with_rule'"
        >
          <ChevronRight class="size-3 mt-0.5 shrink-0" :class="selected === 'yes_with_rule' ? 'opacity-100' : 'opacity-0'" />
          <span class="leading-relaxed">{{ t('confirmCard.yesWithRule', { toolName: toolCall.suggested_rules![0].tool_name, ruleContent: toolCall.suggested_rules![0].rule_content }) }}</span>
        </button>
        <button
          class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors"
          :class="selected === 'no' ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:bg-muted'"
          @click="handleConfirm(false)"
          @mouseenter="selected = 'no'"
        >
          <ChevronRight class="size-3" :class="selected === 'no' ? 'opacity-100' : 'opacity-0'" />
          {{ t('common.no') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { ToolCallBlock } from '@agentscope-ai/agentscope/message';
import { ChevronRight, Wrench } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

type SelectOption = 'yes' | 'yes_with_rule' | 'no';

const props = defineProps<{
  toolCall: ToolCallBlock;
  onUserConfirm: (confirm: boolean, rules?: ToolCallBlock['suggested_rules']) => void;
}>();

const { t } = useTranslation();
const hasSuggestedRules = computed(() => !!(props.toolCall.suggested_rules?.length));
const options = computed<SelectOption[]>(() =>
  hasSuggestedRules.value ? ['yes', 'yes_with_rule', 'no'] : ['yes', 'no'],
);

const selected = ref<SelectOption>('yes');

const displayName = computed(() => {
  const call = props.toolCall;
  return call.name || t('chat.toolCallName', { id: call.id });
});

function handleConfirm(confirm: boolean, rules?: ToolCallBlock['suggested_rules']) {
  props.onUserConfirm(confirm, rules);
  if (confirm) {
    props.toolCall.state = 'allowed';
  } else {
    props.toolCall.state = 'finished';
  }
}

function handleKeyDown(e: KeyboardEvent) {
  const opts = options.value;
  const currentIndex = opts.indexOf(selected.value);
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      selected.value = opts[(currentIndex - 1 + opts.length) % opts.length];
      break;
    case 'ArrowDown':
      e.preventDefault();
      selected.value = opts[(currentIndex + 1) % opts.length];
      break;
    case 'Enter':
      e.preventDefault();
      if (selected.value === 'yes_with_rule') {
        handleConfirm(true, [props.toolCall.suggested_rules![0]]);
      } else {
        handleConfirm(selected.value === 'yes');
      }
      break;
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
</script>
