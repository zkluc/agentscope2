<template>
  <div :class="['flex flex-col w-full max-w-full', isUser ? 'items-end' : 'items-start', 'mb-4']">
    <div
      v-if="showBody"
      :class="['p-4 rounded-xl space-y-2 max-w-full', isUser ? 'w-fit bg-secondary' : 'w-full min-w-full']"
    >
      <template v-for="(block, i) in blocks" :key="i">
        <div v-if="block.type === 'tool_call_group'" class="flex flex-col gap-y-4 text-muted-foreground">
          <ToolGroupRenderer :tool-name="block.toolName" :calls="block.calls" />
          <ConfirmCard
            v-if="block.askingCall"
            :tool-call="block.askingCall"
            :on-user-confirm="(confirm: boolean, rules?: ToolCallBlock['suggested_rules']) => {
              onUserConfirm(block.askingCall!, confirm, message.id, rules);
              block.askingCall!.state = confirm ? 'allowed' : 'finished';
            }"
          />
        </div>
        <div v-else-if="block.type === 'text'" class="prose w-full min-w-full">
          <VueMarkdown :source="block.text" />
        </div>
        <details v-else-if="block.type === 'thinking'" class="text-muted-foreground">
          <summary class="cursor-pointer select-none">{{ t('messageBubble.thinking') }}</summary>
          <p class="mt-1 whitespace-pre-wrap">{{ block.thinking }}</p>
        </details>
        <img
          v-else-if="block.type === 'data' && dataTypeOf(block) === 'image'"
          :src="dataSrc(block)"
          :alt="block.name || 'Uploaded image'"
          class="max-h-80 max-w-full rounded-lg object-contain"
        />
        <video
          v-else-if="block.type === 'data' && dataTypeOf(block) === 'video'"
          controls
          :src="dataSrc(block)"
          class="max-h-80 max-w-full rounded-lg"
        />
        <FileAttachment
          v-else-if="block.type === 'data' && dataTypeOf(block) !== 'audio'"
          :name="block.name"
          :href="dataSrc(block)"
          :media-type="block.source.media_type"
        />
        <div v-else-if="block.type === 'hint'" class="max-w-full">
          <div class="rounded-lg border p-2">
            <ElButton class="group w-full" text @click="toggleHint(i)">
              <component :is="hintIcon(block)" class="size-3.5" />
              <span class="tracking-tight">{{ hintLabel(block) }}</span>
              <span v-if="hintSublabel(block)" class="text-muted-foreground font-normal truncate max-w-[200px]">
                {{ hintSublabel(block) }}
              </span>
              <ChevronDownIcon :class="['ml-auto transition-transform', expandedHints[i] ? 'rotate-180' : '']" />
            </ElButton>
            <div v-if="expandedHints[i]" class="p-2.5 pt-0 max-w-full overflow-hidden break-all text-muted-foreground">
              <template v-for="(inner, j) in hintItems(block)" :key="j">
                <VueMarkdown v-if="inner.type === 'text'" :source="(inner as any).text" />
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div v-if="showFooter" class="flex flex-row items-center justify-start gap-x-2 text-muted-foreground px-2 w-full text-xs">
      <ElTag :type="isRunning ? 'warning' : 'success'" size="small" effect="plain">
        <Loader2 v-if="isRunning" class="animate-spin mr-1" />
        <CheckCircle v-else class="mr-1" />
        <span class="tabular-nums tracking-tighter">{{ elapsedText }}</span>
      </ElTag>
      <span v-if="hasUsage" class="flex items-center gap-1 tabular-nums">
        <ArrowUp class="size-3" />
        {{ formatNumber((message.usage as any)?.input_tokens ?? 0) }}
        <ArrowDown class="size-3 ml-1" />
        {{ formatNumber((message.usage as any)?.output_tokens ?? 0) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import type { ContentBlock, Msg, ToolCallBlock, DataBlock } from '@agentscope-ai/agentscope/message';
import VueMarkdown from 'vue-markdown-render';
import { Loader2, CheckCircle, ArrowUp, ArrowDown, ChevronDownIcon, Bot, CalendarClock, Wrench, MessageSquareQuote } from 'lucide-vue-next';
import { ElTag, ElButton } from 'element-plus';
import ConfirmCard from './ConfirmCard.vue';
import FileAttachment from './FileAttachment.vue';
import ToolGroupRenderer from './ToolGroupRenderer.vue';
import type { ToolCallWithResult } from './tool-renderers/types';
import { useTranslation } from '@/i18n/useI18n';
import { formatNumber, formatTime } from '@/utils/common';

interface ToolCallGroupBlock {
  type: 'tool_call_group';
  id: string;
  toolName: string;
  calls: ToolCallWithResult[];
  askingCall: ToolCallBlock | null;
}

type ExtendedContentBlock = ContentBlock | ToolCallGroupBlock;

const props = defineProps<{
  message: Msg;
  onUserConfirm: (
    toolCallBlock: ToolCallBlock,
    confirm: boolean,
    replyId: string,
    rules?: any,
  ) => void;
}>();

const { t } = useTranslation();
const now = ref(Date.now());
const expandedHints = reactive<Record<number, boolean>>({});

const isRunning = computed(() => !props.message.finished_at);
const hasUsage = computed(() =>
  !!(props.message as any).usage &&
  (((props.message as any).usage?.input_tokens ?? 0) > 0 || ((props.message as any).usage?.output_tokens ?? 0) > 0),
);
const isUser = computed(() => props.message.role === 'user');

let intervalId: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  if (isRunning.value) {
    intervalId = setInterval(() => { now.value = Date.now(); }, 1000);
  }
});
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

const startMs = computed(() => new Date(props.message.created_at).getTime());
const endMs = computed(() => isRunning.value ? now.value : new Date(props.message.finished_at!).getTime());
const elapsedSeconds = computed(() => Math.max(0, (endMs.value - startMs.value) / 1000));
const elapsedText = computed(() => formatTime(elapsedSeconds.value));

function dataTypeOf(block: DataBlock): string {
  return block.source.media_type.split('/')[0];
}

function dataSrc(block: DataBlock): string {
  return block.source.type === 'url'
    ? block.source.url
    : `data:${block.source.media_type};base64,${block.source.data}`;
}

function hintLabel(block: any): string {
  if (!block.source) return t('common.message');
  try {
    const parsed = JSON.parse(block.source) as { label?: string };
    return parsed.label ? t(`messageBubble.hintSource.${parsed.label}`) : block.source;
  } catch {
    return block.source;
  }
}

function hintSublabel(block: any): string | null {
  if (!block.source) return null;
  try {
    const parsed = JSON.parse(block.source) as { sublabel?: string };
    return parsed.sublabel ?? null;
  } catch {
    return null;
  }
}

function hintIcon(block: any): any {
  if (!block.source) return MessageSquareQuote;
  try {
    const parsed = JSON.parse(block.source) as { label?: string };
    if (parsed.label === 'team_message') return Bot;
    if (parsed.label === 'schedule') return CalendarClock;
    if (parsed.label === 'tool_output') return Wrench;
    return MessageSquareQuote;
  } catch {
    return MessageSquareQuote;
  }
}

function hintItems(block: any): any[] {
  return typeof block.hint === 'string'
    ? [{ type: 'text', id: `${block.id}-text`, text: block.hint }]
    : block.hint;
}

function toggleHint(index: number) {
  expandedHints[index] = !expandedHints[index];
}

function groupToolCalls(content: ContentBlock[]): ExtendedContentBlock[] {
  const callMap = new Map<string, ToolCallWithResult>();
  const resultMap = new Map<string, ContentBlock>();
  const ordering: Array<{ type: 'tool'; id: string } | { type: 'other'; block: ContentBlock }> = [];

  for (const block of content) {
    if (block.type === 'tool_call') {
      callMap.set(block.id, { call: block as any });
      ordering.push({ type: 'tool', id: block.id });
    } else if (block.type === 'tool_result') {
      const matching = callMap.get(block.id);
      if (matching) {
        matching.result = block as any;
      } else {
        resultMap.set(block.id, block);
      }
    } else {
      ordering.push({ type: 'other', block });
    }
  }

  const result: ExtendedContentBlock[] = [];
  let currentGroup: ToolCallWithResult[] = [];
  let currentToolName: string | null = null;

  const flush = () => {
    if (currentGroup.length > 0 && currentToolName) {
      const firstAskIdx = currentGroup.findIndex((item) => item.call.state === 'asking');
      result.push({
        type: 'tool_call_group',
        id: crypto.randomUUID(),
        toolName: currentToolName,
        calls: currentGroup,
        askingCall: firstAskIdx === -1 ? null : currentGroup[firstAskIdx].call,
      });
      currentGroup = [];
      currentToolName = null;
    }
  };

  for (const item of ordering) {
    if (item.type === 'other') {
      flush();
      result.push(item.block);
    } else {
      const entry = callMap.get(item.id);
      if (!entry) continue;
      if (currentToolName !== null && currentToolName !== entry.call.name) {
        flush();
      }
      currentToolName = entry.call.name;
      currentGroup.push(entry);
    }
  }
  flush();

  for (const [id, block] of resultMap) {
    if (block.type === 'tool_result') {
      result.push({
        type: 'tool_call_group',
        id: crypto.randomUUID(),
        toolName: block.name,
        calls: [{ call: { type: 'tool_call', id, name: block.name, input: '', state: 'finished' } as any, result: block as any }],
        askingCall: null,
      });
    }
  }

  return result;
}

const content = computed(() => props.message.content || []);
const blocks = computed(() => groupToolCalls(content.value));
const hasBodyContent = computed(() =>
  blocks.value.some((b) => !(b.type === 'data' && (b as any).source?.media_type?.split('/')[0] === 'audio')),
);
const showBody = computed(() => hasBodyContent.value);
const showFooter = computed(() => !isUser.value);
</script>
