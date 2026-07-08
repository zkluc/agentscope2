import { h, defineComponent, ref } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import type { ToolCallBlock, ToolResultBlock } from '@agentscope-ai/agentscope/message';
import type { TFunction, ToolCallWithResult } from './types';
import { CornerLine, ToolStateIcon, parseInput, tryGetFileName } from './_shared';

export function defaultGetDisplayName(call: ToolCallBlock): string {
  return call.name || 'Tool';
}

export function defaultRenderCallArgs(call: ToolCallBlock, t: TFunction): any {
  const fileName = tryGetFileName(call.input);
  if (fileName) return fileName;
  const parsed = parseInput(call.input);
  const keys = Object.keys(parsed);
  if (keys.length > 0) {
    return keys
      .map((k) => {
        const v = parsed[k];
        return `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`;
      })
      .join(', ');
  }
  return call.input || t('toolRender.noArgs');
}

export function defaultRenderResult(call: ToolCallBlock, result: ToolResultBlock, t: TFunction): any {
  if (call.state === 'asking' || result.state === 'running') {
    return h('span', { class: 'text-xs text-muted-foreground' }, `${t('common.running')} ...`);
  }
  if (result.state === 'interrupted') {
    return h('span', { class: 'text-xs text-muted-foreground' }, t('common.interrupted'));
  }

  let resultStr: string;
  if (typeof result.output === 'string') {
    resultStr = result.output;
  } else {
    const parts = result.output.map((b) => {
      if (b.type === 'text') return b.text;
      const mainType = b.source.media_type.split('/')[0].toUpperCase();
      const extIdx = b.source.media_type.lastIndexOf('/');
      const ext = extIdx >= 0 ? b.source.media_type.slice(extIdx + 1) : 'bin';
      return `[${mainType}.${ext}]`;
    });
    resultStr = parts.join('\n');
  }

  const maxLines = 7;
  let lines = resultStr.split('\n');
  if (lines.length > maxLines) {
    const total = lines.length;
    lines = lines.slice(0, maxLines);
    lines.push(t('tool.moreLines', { count: total - maxLines }));
  }

  return h('div', { class: 'flex flex-col flex-1 min-w-0' },
    lines.map((line, i) =>
      h('div', { key: i, class: 'truncate text-xs' }, line),
    ),
  );
}

/** @internal used for type compatibility */
export function _noop() {}

export function defaultRenderConfirmBody(call: ToolCallBlock): any {
  return h('code', { class: 'text-xs whitespace-pre-wrap break-all' }, call.input);
}

function processToolInput(input: string): string {
  try {
    const obj = JSON.parse(input);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: "${v}"`)
      .join('\n');
  } catch {
    return input;
  }
}

/** Per-call collapsible wrapper matching React's Collapsible pattern. */
const ToolCallItem = defineComponent({
  name: 'ToolCallItem',
  props: {
    displayName: { type: String, required: true },
    hasResult: Boolean,
    state: String,
  },
  setup(props, { slots }) {
    const open = ref(false);
    return () => {
      const argsVNode = slots.args?.();
      const resultVNode = slots.default?.();
      return h('div', { class: 'flex flex-col w-full max-w-full text-sm' }, [
        h('button', {
          class: 'group flex items-center gap-2 w-full text-left px-0 py-0.5 hover:bg-transparent active:translate-y-0',
          onClick: () => { open.value = !open.value; },
          type: 'button',
        }, [
          ToolStateIcon({ states: [(props.state ?? undefined) as any] }),
          h('strong', { class: 'shrink-0 text-primary text-sm' }, props.displayName),
          argsVNode
            ? h('span', { class: 'truncate min-w-0 text-left text-muted-foreground text-sm' }, argsVNode)
            : null,
          props.hasResult
            ? h(ChevronRight, {
                class: 'size-3 shrink-0 ml-auto transition-transform duration-200',
                style: open.value ? { transform: 'rotate(90deg)' } : {},
              })
            : null,
        ]),
        props.hasResult && open.value
          ? h('div', { class: 'flex flex-row gap-x-2 pl-6 max-w-full mt-1' }, [
              CornerLine({}),
              h('div', { class: 'flex flex-col flex-1 min-w-0' }, resultVNode),
            ])
          : null,
      ]);
    };
  },
});

export function defaultRenderGroup(
  calls: ToolCallWithResult[],
  _t: TFunction,
  resolvers: {
    getDisplayName: (call: ToolCallBlock) => string;
    renderCallArgs: (call: ToolCallBlock) => any;
    renderResult: (call: ToolCallBlock, result: ToolResultBlock) => any;
  },
): any {
  if (calls.length === 0) return null;

  return h('div', { class: 'flex flex-col w-full' }, [
    ...calls.map((item) => {
      const resultContent = item.result
        ? resolvers.renderResult(item.call, item.result)
        : null;
      const rawArgs = resolvers.renderCallArgs(item.call);
      const argsText = typeof rawArgs === 'string' ? rawArgs : processToolInput(item.call.input);
      return h(ToolCallItem, {
        key: item.call.id,
        displayName: resolvers.getDisplayName(item.call),
        hasResult: !!resultContent,
        state: item.result?.state,
      }, {
        default: () => resultContent,
        args: () => argsText,
      });
    }),
  ]);
}
