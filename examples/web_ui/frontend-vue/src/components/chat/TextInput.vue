<template>
  <div
    id="tour-chat-input"
    data-tour="chat-input"
    :class="['flex flex-col gap-2 rounded-2xl border bg-background p-3', className]"
  >
    <div v-if="files.length > 0" class="flex flex-wrap gap-2">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm"
      >
        <Loader2 v-if="file.status === 'processing'" class="h-3 w-3 shrink-0 animate-spin text-muted-foreground/70" />
        <span class="max-w-[200px] truncate">{{ file.name }}</span>
        <button
          class="text-muted-foreground hover:text-foreground"
          @click="files.splice(index, 1)"
        >
          <X class="h-3 w-3" />
        </button>
      </div>
    </div>

    <div class="relative">
      <div class="relative">
        <textarea
          ref="textareaRef"
          v-model="text"
          :placeholder="placeholderText"
          :disabled="disabled"
          rows="1"
          class="w-full resize-none rounded-md border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          :style="{ maxHeight: 'calc(1.5em * 6)', lineHeight: '1.5em', overflowY: 'auto' }"
          @keydown="handleKeyDown"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />

        <div
          v-if="suggestion && isFocused"
          class="pointer-events-none absolute left-0 top-0 px-3 py-2 text-sm"
          style="line-height: 1.5em; white-space: pre-wrap; word-wrap: break-word;"
        >
          <span class="invisible">{{ text }}</span>
          <span class="text-muted-foreground">{{ suggestion }}</span>
          <span class="ml-2 text-xs text-muted-foreground/60">
            Tab
            {{ t('textInput.toComplete') }}
          </span>
        </div>
      </div>

      <div class="mt-2 flex items-center justify-between">
        <div>
          <span :class="['text-muted-foreground text-sm', !isFocused && 'hidden']">
            {{ isMac() ? '⇧' : 'Shift' }} + Enter {{ t('textInput.newLine') }}
          </span>
        </div>
        <div class="flex gap-2">
          <ElTooltip :content="attachDisabled && allowedInputTypes?.length === 0 ? t('textInput.attachNotSupported') : t('textInput.attach')" placement="top">
            <ElButton
              type=""
              :disabled="attachDisabled"
              class="shrink-0 rounded-full"
              @click="fileInputRef?.click()"
            >
              <Paperclip class="h-4 w-4" />
            </ElButton>
          </ElTooltip>

          <ElTooltip :content="t('textInput.send')" placement="top">
            <ElButton
              type="primary"
              :disabled="disabled || !text.trim() || hasProcessing"
              class="shrink-0 rounded-full"
              @click="handleSend"
            >
              <Send class="h-4 w-4" />
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
import { Paperclip, Send, Loader2, X } from 'lucide-vue-next';
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
