<template>
  <div class="ring ring-border rounded-xl w-full p-4 space-y-4 text-sm overflow-hidden">
    <div class="flex flex-col gap-y-2">
      <strong class="text-secondary-foreground">{{ displayName }}</strong>
      <div class="px-4 py-2 bg-white rounded-sm">
        <code class="text-xs whitespace-pre-wrap break-all">{{ toolCall.input }}</code>
      </div>
    </div>
    <div class="flex flex-col">
      <strong class="text-secondary-foreground mb-1">{{ t('chat.confirmToolCall') }}</strong>
      <ElButton
        :class="['flex justify-start cursor-pointer', selected === 'yes' ? 'text-primary' : 'text-muted-foreground']"
        size="small"
        text
        @mouseenter="selected = 'yes'"
        @click="handleConfirm(true)"
      >
        <ChevronRight :class="['size-4', selected === 'yes' ? 'visible' : 'invisible']" />
        1. {{ t('common.yes') }}
        <span :class="[selected === 'yes' ? 'text-muted-foreground' : 'invisible']">
          ({{ t('confirmCard.toConfirm') }})
        </span>
      </ElButton>
      <ElButton
        v-if="hasSuggestedRules"
        :class="['flex flex-wrap justify-start items-start cursor-pointer h-auto text-left', selected === 'yes_with_rule' ? 'text-primary' : 'text-muted-foreground']"
        size="small"
        text
        @mouseenter="selected = 'yes_with_rule'"
        @click="handleConfirm(true, [toolCall.suggested_rules![0]])"
      >
        <span class="flex items-start gap-1 w-full break-words whitespace-normal min-w-0">
          <ChevronRight :class="['size-4 shrink-0 mt-0.5', selected === 'yes_with_rule' ? 'visible' : 'invisible']" />
          <span class="break-words min-w-0">
            2. {{ t('confirmCard.yesWithRule', { toolName: toolCall.suggested_rules![0].tool_name, ruleContent: toolCall.suggested_rules![0].rule_content }) }}
            <span v-if="selected === 'yes_with_rule'" class="text-muted-foreground ml-1 whitespace-nowrap">
              ({{ t('confirmCard.toConfirm') }})
            </span>
          </span>
        </span>
      </ElButton>
      <ElButton
        :class="['flex justify-start cursor-pointer', selected === 'no' ? 'text-primary' : 'text-muted-foreground']"
        size="small"
        text
        @mouseenter="selected = 'no'"
        @click="handleConfirm(false)"
      >
        <ChevronRight :class="['size-4', selected === 'no' ? 'visible' : 'invisible']" />
        {{ hasSuggestedRules ? '3' : '2' }}. {{ t('common.no') }}
        <span :class="[selected === 'no' ? 'text-muted-foreground' : 'invisible']">
          ({{ t('confirmCard.toConfirm') }})
        </span>
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { ToolCallBlock } from '@agentscope-ai/agentscope/message';
import { ChevronRight } from 'lucide-vue-next';
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
