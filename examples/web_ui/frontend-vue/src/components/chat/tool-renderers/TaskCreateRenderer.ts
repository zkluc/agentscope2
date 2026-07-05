import { h, ref } from 'vue';
import type { ToolCallBlock } from '@agentscope-ai/agentscope/message';
import type { TFunction, ToolCallWithResult, ToolRenderer } from './types';
import { CornerLine, ToolStateIcon } from './_shared';

function parseInput(input: string): Record<string, unknown> {
  try { return JSON.parse(input); } catch { return {}; }
}

function TaskCreateGroup({ calls, t }: { calls: ToolCallWithResult[]; t: TFunction }) {
  const open = ref(false);

  return h('div', { class: 'flex flex-col w-full' }, [
    h('div', {
      class: 'flex flex-row gap-x-2 w-full max-w-full items-center cursor-pointer text-left',
      onClick: () => { open.value = !open.value; },
    }, [
      ToolStateIcon({ states: calls.map((c) => c.result?.state) }),
      h('span', { class: 'text-sm flex-1 min-w-0 truncate' }, [
        h('strong', { class: 'text-primary' }, t('tool.taskCreate.label')),
        ' ',
        t('tool.taskCreate.count', { count: calls.length }),
        !open.value ? h('span', { class: 'text-muted-foreground' }, ' ...') : null,
      ]),
    ]),
    open.value ? h('div', { class: 'pl-6 pt-2 flex flex-col gap-y-2 text-sm' }, [
      ...calls.map(({ call, result }) => {
        const input = parseInput(call.input);
        const subject = (input.subject as string) || '(untitled)';
        const description = (input.description as string) || '';
        const resultText = typeof result?.output === 'string'
          ? result.output
          : Array.isArray(result?.output)
            ? result.output.map((b: any) => ('text' in b ? b.text : '')).join('')
            : '';
        const idMatch = resultText.match(/^Task \(id=(\d+)\)/);
        const taskId = idMatch ? idMatch[1] : null;
        return h('div', { key: call.id, class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'text-xs break-all font-medium' }, [
            taskId ? h('span', { class: 'text-muted-foreground font-mono' }, `#${taskId}`) : null,
            taskId ? ' ' : null,
            subject,
          ]),
          description ? h('div', { class: 'flex flex-row gap-x-2 items-start pl-2 text-xs' }, [
            CornerLine({}),
            h('span', { class: 'text-muted-foreground break-all' }, description),
          ]) : null,
        ]);
      }),
    ]) : null,
  ]);
}

export const TaskCreateRenderer: ToolRenderer = {
  getDisplayName: (_call: ToolCallBlock, t: TFunction) => t('tool.taskCreate.name'),

  renderCallArgs: (call: ToolCallBlock) => {
    const input = parseInput(call.input);
    return (input.subject as string) || '';
  },

  renderGroup: (calls: ToolCallWithResult[], t: TFunction) => TaskCreateGroup({ calls, t }),
};
