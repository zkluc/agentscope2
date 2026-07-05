import { h } from 'vue';
import { Wrench } from 'lucide-vue-next';
import type { ToolCallBlock, ToolResultBlock } from '@agentscope-ai/agentscope/message';
import type { TFunction, ToolCallWithResult } from './types';
import { ToolStateIcon, parseInput, tryGetFileName } from './_shared';

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

export function defaultRenderResult(_call: ToolCallBlock, result: ToolResultBlock, t: TFunction): any {
  const content = (result as any).content;
  if (content && content.length > 0) {
    const text = content
      .map((c: any) => (c.type === 'text' ? c.text : ''))
      .filter(Boolean)
      .join('\n');
    if (text) {
      return h('pre', { class: 'text-xs overflow-auto max-h-48' }, text);
    }
  }
  return h('span', { class: 'text-xs text-muted-foreground' },
    result.state === 'success' ? t('toolRender.success') : t('toolRender.failed'));
}

/** @internal used for type compatibility */
export function _noop() {}

export function defaultRenderConfirmBody(call: ToolCallBlock): any {
  return h('code', { class: 'text-xs whitespace-pre-wrap break-all' }, call.input);
}

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

  const hasResult = calls.some((item) => item.result);

  return h('div', { class: 'flex flex-col w-full gap-1 text-sm' }, [
    h('div', { class: 'flex flex-row gap-x-2 w-full max-w-full items-center' }, [
      ToolStateIcon({ states: calls.map((item) => item.result?.state) }),
      h(Wrench, { class: 'size-3.5 shrink-0' }),
      h('span', { class: 'font-medium' }, resolvers.getDisplayName(calls[0].call)),
    ]),
    ...calls.map((item) =>
      h('div', { key: item.call.id, class: 'flex flex-col w-full ml-6 border-l border-border pl-3' }, [
        h('div', { class: 'flex flex-row gap-1 py-0.5' }, [
          h('span', { class: 'text-muted-foreground shrink-0' }, '→'),
          h('span', { class: 'truncate' }, resolvers.renderCallArgs(item.call)),
        ]),
        hasResult && item.result
          ? h('div', { class: 'pl-4 mt-1' }, resolvers.renderResult(item.call, item.result))
          : null,
      ]),
    ),
  ]);
}
