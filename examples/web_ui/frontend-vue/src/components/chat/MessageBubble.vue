<template>
  <div :class="['flex flex-col w-full max-w-full', isUser ? 'items-end' : 'items-start', 'mb-4']">
    <div
      v-if="showBody"
      :class="[
        'space-y-2 max-w-full overflow-hidden',
        isUser
          ? 'w-fit max-w-[75%] bg-[var(--warm-stone)] rounded-[8px] px-3 py-2'
          : 'w-full',
      ]"
    >
      <template v-for="(block, i) in blocks" :key="block.id ?? `block-${i}`">
        <div v-if="block.type === 'tool_call_group'" v-memo="[block, block.id]" :class="blockPad">
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
        <div v-else-if="block.type === 'text'" v-memo="[block.text]" :class="['prose prose-sm w-full min-w-full', blockPad]">
          <VueMarkdown :source="block.text" />
        </div>
        <div v-else-if="block.type === 'thinking'" :class="blockPad">
          <div
            @click="toggleThinking(i)"
            class="flex items-center cursor-pointer select-none border-t border-[var(--brass)] pt-2"
          >
            <span
              :class="[
                'text-[var(--brass)] transition-transform duration-200 text-xs',
                expandedThinking[i] ? 'rotate-90' : '',
              ]"
            >▸</span>
            <span class="text-[10px] font-mono tracking-wider text-[var(--brass)] uppercase ml-2">
              {{ t('messageBubble.thinking') }}
            </span>
          </div>
          <div
            v-if="expandedThinking[i]"
            class="mt-2 bg-[var(--warm-thinking)] border-l-2 border-[var(--brass)] rounded p-3 whitespace-pre-wrap text-xs"
          >
            {{ block.thinking }}
          </div>
        </div>
        <div v-else-if="block.type === 'genui'" :class="blockPad">
          <GenUIRenderer
            v-memo="[block, block.generating]"
            :block="block"
            :is-generating="!!block.generating"
          />
        </div>
        <img
          v-else-if="block.type === 'data' && dataTypeOf(block) === 'image'"
          :src="dataSrc(block)"
          :alt="block.name || 'Uploaded image'"
          :class="['max-h-80 max-w-full rounded-[8px] object-contain', blockPad]"
        />
        <video
          v-else-if="block.type === 'data' && dataTypeOf(block) === 'video'"
          controls
          :src="dataSrc(block)"
          :class="['max-h-80 max-w-full rounded-[8px]', blockPad]"
        />
        <FileAttachment
          v-else-if="block.type === 'data' && dataTypeOf(block) !== 'audio'"
          :name="block.name"
          :href="dataSrc(block)"
          :media-type="block.source.media_type"
        />
        <div v-else-if="block.type === 'hint'" :class="[blockPad, 'max-w-full']">
          <div class="rounded-lg border bg-muted/30 p-2">
            <ElButton class="group w-full" text @click="toggleHint(i)">
              <span class="text-xs mr-2">{{ hintIcon(block) }}</span>
              <span class="text-xs font-medium">{{ hintLabel(block) }}</span>
              <span v-if="hintSublabel(block)" class="text-muted-foreground font-normal truncate max-w-[200px] ml-1">
                {{ hintSublabel(block) }}
              </span>
              <span
                :class="['ml-auto text-xs transition-transform duration-200 text-[var(--brass)]', expandedHints[i] ? 'rotate-90' : '']"
              >▸</span>
            </ElButton>
            <div v-if="expandedHints[i]" class="p-2.5 pt-0 max-w-full overflow-hidden break-all text-muted-foreground text-xs">
              <template v-for="(inner, j) in hintItems(block)" :key="j">
                <VueMarkdown v-if="inner.type === 'text'" :source="(inner as any).text" />
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div v-if="showFooter" class="flex flex-row items-center gap-2 font-mono text-[11px] text-[var(--slate-muted)] px-1 w-full mt-1">
      <span class="inline-flex items-center gap-1">
        <span v-if="isRunning" class="inline-block size-2 rounded-full bg-current animate-pulse"></span>
        <span v-else>✓</span>
        {{ elapsedText }}
      </span>
      <span v-if="hasUsage" class="inline-flex items-center gap-1">
        · ↑{{ formatNumber((message.usage as any)?.input_tokens ?? 0) }} ↓{{ formatNumber((message.usage as any)?.output_tokens ?? 0) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import type { ContentBlock, Msg, ToolCallBlock, DataBlock } from '@agentscope-ai/agentscope/message';
import VueMarkdown from 'vue-markdown-render';
import { ElButton } from 'element-plus';
import ConfirmCard from './ConfirmCard.vue';
import FileAttachment from './FileAttachment.vue';
import ToolGroupRenderer from './ToolGroupRenderer.vue';
import GenUIRenderer from './GenUIRenderer.vue';
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

interface GenUIBlock {
  type: 'genui';
  id?: string;
  schema: string | object;
  state?: Record<string, any>;
  generating?: boolean;
}

type ExtendedContentBlock = ContentBlock | ToolCallGroupBlock | GenUIBlock;

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
const expandedThinking = reactive<Record<number, boolean>>({});

const isRunning = computed(() => !props.message.finished_at);
const hasUsage = computed(() =>
  !!(props.message as any).usage &&
  (((props.message as any).usage?.input_tokens ?? 0) > 0 || ((props.message as any).usage?.output_tokens ?? 0) > 0),
);
const isUser = computed(() => props.message.role === 'user');
const blockPad = computed(() => isUser.value ? '' : 'px-4 first:pt-4 last:pb-4');

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

function hintIcon(block: any): string {
  if (!block.source) return '\u275E';
  try {
    const parsed = JSON.parse(block.source) as { label?: string };
    if (parsed.label === 'team_message') return '\u2139';
    if (parsed.label === 'schedule') return '\u23F0';
    if (parsed.label === 'tool_output') return '\u2692';
    return '\u275E';
  } catch {
    return '\u275E';
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

function toggleThinking(index: number) {
  expandedThinking[index] = !expandedThinking[index];
}

function groupToolCalls(content: ContentBlock[], genuiCache?: Map<string, GenUIBlock>): ExtendedContentBlock[] {
  const callMap = new Map<string, ToolCallWithResult>();
  const resultMap = new Map<string, ContentBlock>();
  const ordering: Array<{ type: 'tool'; id: string } | { type: 'other'; block: ContentBlock }> = [];
  
  function extractGenUISchema(toolResult: any, callId?: string): GenUIBlock | null {
    try {
      const output = toolResult.output;
      const text = Array.isArray(output)
        ? output
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('')
        : typeof output === 'string'
          ? output
          : '';
      if (!text) return null;
      const parsed = JSON.parse(text);
      if (parsed.type === 'genui' && parsed.schema) {
        const state = parsed.schema.state || parsed.state || {};
        const cacheKey = callId || JSON.stringify(parsed.schema);
        if (genuiCache?.has(cacheKey)) {
          const cached = genuiCache.get(cacheKey)!;
          cached.generating = toolResult.state === 'running';
          return cached;
        }
        const block: GenUIBlock = {
          type: 'genui',
          id: callId || cacheKey,
          schema: parsed.schema,
          state,
          generating: toolResult.state === 'running',
        };
        genuiCache?.set(cacheKey, block);
        return block;
      }
    } catch {
      // parse failure — likely partial JSON during streaming
    }
    return null;
  }

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
      if (currentToolName === 'generate_genui') {
        const matched = currentGroup.find((item) => item.result);
        if (matched?.result) {
          const genuiBlock = extractGenUISchema(matched.result, matched.call.id);
          if (genuiBlock) {
            result.push(genuiBlock);
            currentGroup = [];
            currentToolName = null;
            return;
          }
        }
      }
      const firstAskIdx = currentGroup.findIndex((item) => item.call.state === 'asking');
      const groupId = currentGroup.map((c) => c.call.id).join('-');
      result.push({
        type: 'tool_call_group',
        id: `tcg-${currentToolName}-${groupId}`,
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
      const genuiBlock = extractGenUISchema(block, id);
      if (genuiBlock) {
        result.push(genuiBlock);
      } else {
        result.push({
          type: 'tool_call_group',
          id: `tcg-orphan-${id}`,
          toolName: block.name,
          calls: [{ call: { type: 'tool_call', id, name: block.name, input: '', state: 'finished' } as any, result: block as any }],
          askingCall: null,
        });
      }
    }
  }

  return result;
}

const content = computed(() => props.message.content || []);
const genuiCache = new Map<string, GenUIBlock>();

const blocks = computed(() => groupToolCalls(content.value, genuiCache));
const hasBodyContent = computed(() =>
  blocks.value.some((b) => !(b.type === 'data' && (b as any).source?.media_type?.split('/')[0] === 'audio')),
);
const showBody = computed(() => hasBodyContent.value);
const showFooter = computed(() => !isUser.value);
</script>
