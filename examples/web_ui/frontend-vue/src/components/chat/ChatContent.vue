<template>
  <div :class="['flex flex-col h-full w-full items-center p-2 gap-4', className]">
    <div
      ref="scrollAreaRef"
      class="flex-1 w-full max-w-full overflow-auto no-scrollbar overflow-x-hidden"
      @scroll="handleScroll"
    >
      <div class="flex flex-col gap-4 size-full max-w-full">
        <MessageBubble
          v-for="message in msgs"
          :key="message.id"
          :message="message"
          :on-user-confirm="onUserConfirm"
        />
        <Empty v-if="msgs.length === 0" />
      </div>
    </div>
    <div v-if="$slots.footer" class="w-full max-w-full shrink-0">
      <slot name="footer" />
    </div>
    <TextInput
      class="min-w-full max-w-full w-full"
      :on-send="onSend"
      :disabled="disabled"
      :auto-complete="autoComplete"
      :allowed-input-types="allowedInputTypes"
      :file-processor="fileProcessor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ContentBlock, Msg, ToolCallBlock } from '@agentscope-ai/agentscope/message';
import MessageBubble from './MessageBubble.vue';
import TextInput from './TextInput.vue';
import Empty from './Empty.vue';

const props = defineProps<{
  msgs: Msg[];
  sending: boolean;
  disabled: boolean;
  onSend: (content: ContentBlock[]) => void;
  onUserConfirm: (
    toolCall: ToolCallBlock,
    confirm: boolean,
    replyId: string,
    rules?: ToolCallBlock['suggested_rules'],
  ) => void;
  autoComplete?: (input: string) => string | null;
  className?: string;
  allowedInputTypes: string[];
  fileProcessor: (file: File) => Promise<ContentBlock | null>;
}>();

defineSlots<{
  footer?: () => any;
  default?: () => any;
}>();

const scrollAreaRef = ref<HTMLDivElement | null>(null);
const wasNearBottom = ref(true);

function handleScroll() {
  const el = scrollAreaRef.value;
  if (!el) return;
  const { scrollTop, scrollHeight, clientHeight } = el;
  wasNearBottom.value = scrollTop + clientHeight >= scrollHeight - 50;
}

watch(
  () => props.msgs,
  () => {
    const el = scrollAreaRef.value;
    if (wasNearBottom.value && el) {
      el.scrollTo({
        top: el.scrollHeight,
      });
    }
  },
);
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
