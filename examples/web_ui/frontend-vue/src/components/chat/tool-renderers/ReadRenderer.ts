import { h, ref } from 'vue';
import type { ToolCallBlock, ToolResultBlock } from '@agentscope-ai/agentscope/message';
import type { TFunction, ToolCallWithResult, ToolRenderer } from './types';
import { CornerLine, getFilePath, ToolStateIcon } from './_shared';
import { formatNumber } from '@/utils/common';

function countResultLines(result?: ToolResultBlock): number {
  if (!result) return 0;
  let str: string;
  if (typeof result.output === 'string') {
    str = result.output;
  } else {
    str = (result.output as any[]).map((b: any) => (b.type === 'text' ? b.text : '')).join('\n');
  }
  if (!str) return 0;
  return str.split('\n').length;
}

function groupByConsecutivePath(calls: ToolCallWithResult[]): Array<{ path: string; calls: ToolCallWithResult[] }> {
  const groups: Array<{ path: string; calls: ToolCallWithResult[] }> = [];
  for (const item of calls) {
    const path = getFilePath(item.call.input);
    const last = groups[groups.length - 1];
    if (last && last.path === path) {
      last.calls.push(item);
    } else {
      groups.push({ path, calls: [item] });
    }
  }
  return groups;
}

function ReadGroup({ calls, t }: { calls: ToolCallWithResult[]; t: TFunction }) {
  const open = ref(false);
  const name = t('tool.read.name');

  return h('div', { class: 'flex flex-col w-full' }, [
    h('div', {
      class: 'flex flex-row gap-x-2 w-full max-w-full items-center cursor-pointer text-left hover:bg-transparent',
      onClick: () => { open.value = !open.value; },
    }, [
      ToolStateIcon({ states: calls.map((c) => c.result?.state) }),
      h('span', { class: 'flex items-center text-sm truncate gap-1' }, [
        h('strong', { class: 'text-primary' }, name),
        ' ',
        t('tool.read.fileCount', { count: calls.length }),
      ]),
      h('span', { class: 'size-3 transition-transform', style: open.value ? 'transform: rotate(90deg)' : '' }, '\u203A'),
    ]),
    open.value ? h('div', { class: 'pl-6 pt-2 flex flex-col gap-y-2 text-sm' }, [
      ...groupByConsecutivePath(calls).map((group, gIdx) =>
        h('div', { key: gIdx, class: 'flex flex-col min-w-0' }, [
          h('div', { class: 'truncate' }, [
            h('span', { class: 'text-xs !overflow-visible !whitespace-normal !text-clip break-all' }, group.path),
          ]),
          ...group.calls.map(({ call, result }) => {
            if (!result) return null;
            const lines = countResultLines(result);
            return h('div', { key: call.id, class: 'flex flex-row gap-x-2 items-center pl-2 text-xs' }, [
              CornerLine({}),
              h('span', { class: 'text-muted-foreground' },
                t('tool.read.lineCount', { count: lines, formatted: formatNumber(lines) })),
            ]);
          }),
        ]),
      ),
    ]) : null,
  ]);
}

export const ReadRenderer: ToolRenderer = {
  getDisplayName: (_call: ToolCallBlock, t: TFunction) => t('tool.read.name'),

  renderCallArgs: (call: ToolCallBlock) => getFilePath(call.input),

  renderConfirmBody: (call: ToolCallBlock) =>
    h('div', { class: 'w-full max-w-full overflow-hidden text-ellipsis truncate' }, [
      h('div', { class: 'text-secondary-foreground' }, getFilePath(call.input)),
    ]),

  renderGroup: (calls: ToolCallWithResult[], t: TFunction) => ReadGroup({ calls, t }),
};
