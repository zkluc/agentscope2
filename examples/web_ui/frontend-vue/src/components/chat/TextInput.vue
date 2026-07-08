<template>
  <div
    id="tour-chat-input"
    data-tour="chat-input"
    :class="[
      'flex flex-col gap-2 rounded-[10px] border border-border/80 bg-card transition-shadow duration-150',
      isFocused ? 'ring-1 ring-[var(--brass)]/20' : '',
      className,
    ]"
  >
    <div class="p-3 pb-0">
      <div v-if="files.length > 0" class="flex flex-wrap gap-2 mb-2">
        <div
          v-for="(file, index) in files"
          :key="index"
          class="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs"
        >
          <span v-if="file.status === 'processing'" class="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span class="max-w-[180px] truncate text-foreground/80">{{ file.name }}</span>
          <button
            class="text-muted-foreground hover:text-foreground transition-colors"
            @click="files.splice(index, 1)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div class="relative px-3 pb-3">
      <textarea
        ref="textareaRef"
        v-model="text"
        :placeholder="placeholderText"
        :disabled="disabled"
        rows="1"
        class="w-full resize-none rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        :style="{ maxHeight: 'calc(1.5em * 6)', lineHeight: '1.5em', overflowY: 'auto' }"
        @keydown="handleKeyDown"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <div
        v-if="suggestion && isFocused"
        class="pointer-events-none absolute left-0 top-0 px-3 py-2.5 text-sm"
        style="line-height: 1.5em; white-space: pre-wrap; word-wrap: break-word;"
      >
        <span class="invisible">{{ text }}</span>
        <span class="text-muted-foreground/40">{{ suggestion }}</span>
        <span class="ml-2 text-[10px] text-muted-foreground/30">
          Tab
          {{ t('textInput.toComplete') }}
        </span>
      </div>

      <div class="mt-2 flex items-center justify-between">
        <div>
          <span :class="['text-[11px] text-muted-foreground/50', !isFocused && 'hidden']">
            {{ isMac() ? '⇧' : 'Shift' }} + Enter {{ t('textInput.newLine') }}
          </span>
        </div>
        <div class="flex gap-1.5">
          <ElTooltip :content="attachDisabled && allowedInputTypes?.length === 0 ? t('textInput.attachNotSupported') : t('textInput.attach')" placement="top">
            <ElButton
              :disabled="attachDisabled"
              class="shrink-0 rounded-full size-8"
              @click="fileInputRef?.click()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </ElButton>
          </ElTooltip>

          <ElTooltip :content="t('textInput.send')" placement="top">
            <ElButton
              type="primary"
              :disabled="disabled || !text.trim() || hasProcessing"
              class="shrink-0 rounded-full size-8"
              @click="handleSend"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </ElButton>
          </ElTooltip>

          <input
            ref="fileInputRef"
            type="file"
            multiple
            :accept="acceptAttr"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ContentBlock, TextBlock } from '@agentscope-ai/agentscope/message';

import { ElTooltip, ElButton } from 'element-plus';
import { useTranslation } from '@/i18n/useI18n';
import { isMac } from '@/utils/platform';

interface ProcessedFile {
  name: string;
  status: 'processing' | 'done';
  block: ContentBlock | null;
}

const props = defineProps<{
  onSend: (blocks: ContentBlock[]) => void;
  placeholder?: string;
  autoComplete?: (input: string) => string | null;
  disabled?: boolean;
  className?: string;
  allowedInputTypes?: string[];
  fileProcessor: (file: File) => Promise<ContentBlock | null>;
}>();

const { t } = useTranslation();
const text = ref('');
const files = ref<ProcessedFile[]>([]);
const isFocused = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const placeholderText = computed(() => props.placeholder || t('chat.inputPlaceholder'));

const acceptAttr = computed(() =>
  props.allowedInputTypes && props.allowedInputTypes.length > 0
    ? props.allowedInputTypes.join(',')
    : undefined,
);

const attachDisabled = computed(() =>
  props.disabled || (props.allowedInputTypes !== undefined && props.allowedInputTypes.length === 0),
);

const hasProcessing = computed(() => files.value.some((f) => f.status === 'processing'));

const suggestion = computed(() => {
  if (props.autoComplete && text.value && isFocused.value) {
    const result = props.autoComplete(text.value);
    if (result && result.startsWith(text.value)) {
      return result.substring(text.value.length);
    }
    return result || '';
  }
  return '';
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Tab' && suggestion.value) {
    e.preventDefault();
    text.value += suggestion.value;
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey && !(e as any).isComposing) {
    e.preventDefault();
    handleSend();
  }
}

function handleSend() {
  if (!text.value.trim() || props.disabled || hasProcessing.value) return;

  const blocks: ContentBlock[] = [];

  if (text.value.trim()) {
    const textBlock: TextBlock = {
      id: crypto.randomUUID(),
      type: 'text',
      text: text.value.trim(),
    };
    blocks.push(textBlock);
  }

  files.value.forEach((f) => {
    if (f.status === 'done' && f.block) {
      blocks.push(f.block);
    }
  });

  props.onSend(blocks);
  text.value = '';
  files.value = [];
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;
  const selected = Array.from(input.files);
  input.value = '';

  selected.forEach((file) => {
    const placeholder: ProcessedFile = {
      name: file.name,
      status: 'processing',
      block: null,
    };
    files.value = [...files.value, placeholder];

    props
      .fileProcessor(file)
      .then((block) => {
        files.value = files.value
          .map((f) =>
            f.name === file.name && f.status === 'processing'
              ? block
                ? { ...f, status: 'done', block }
                : null
              : f,
          )
          .filter(Boolean) as ProcessedFile[];
      })
      .catch(() => {
        files.value = files.value.filter(
          (f) => !(f.name === file.name && f.status === 'processing'),
        );
      });
  });
}

function focus() {
  textareaRef.value?.focus();
}

defineExpose({ focus });
</script>
