import { h } from 'vue';
import { Circle, Plus, Minus, CornerDownRight } from 'lucide-vue-next';
import type { ToolResultBlock } from '@agentscope-ai/agentscope/message';
import type { ToolCallWithResult } from './types';
import { formatNumber } from '@/utils/common';

export function TreeLine({ index, total, className = 'size-3' }: { index: number; total: number; className?: string }) {
  return h('span', { class: `shrink-0 flex items-center ${className}` }, [
    h(CornerDownRight, {
      class: index === total - 1 ? 'size-3' : 'size-3 rotate-90',
      'stroke-width': 1,
    }),
  ]);
}

export function CornerLine({ className = 'size-3' }: { className?: string }) {
  return h('span', { class: `shrink-0 ${className}` }, [
    h(CornerDownRight, { class: 'size-3', 'stroke-width': 1 }),
  ]);
}

export function ToolStateIcon({ states }: { states: (ToolResultBlock['state'] | undefined)[] }) {
  let cls = 'text-muted-foreground fill-muted-foreground';
  if (states.includes('running') || states.includes(undefined)) {
    cls = 'text-muted-foreground fill-muted-foreground animate-pulse';
  } else if (states.every((s) => s === 'success')) {
    cls = 'text-green-500 fill-green-500';
  } else if (states.some((s) => s === 'error')) {
    cls = 'text-red-500 fill-red-500';
  } else if (states.some((s) => s === 'interrupted')) {
    cls = 'text-yellow-500 fill-yellow-500';
  }
  return h(Circle, { class: `size-2.5 shrink-0 ${cls}`, 'stroke-width': 0 });
}

export function parseInput(input: string): Record<string, unknown> {
  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
}

export function getFilePath(input: string): string {
  const { file_path } = parseInput(input) as { file_path?: string };
  return file_path || input;
}

export function getFileName(input: string): string {
  const fp = getFilePath(input);
  const segments = fp.split(/[/\\]+/).filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : fp;
}

export function tryGetFileName(input: string): string | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== 'object') return undefined;
  const filePath = (parsed as { file_path?: unknown }).file_path;
  if (typeof filePath !== 'string' || filePath.length === 0) return undefined;
  const segments = filePath.split(/[/\\]+/).filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : filePath;
}

export function countDiffStats(diffText: string): { insertions: number; deletions: number } {
  let insertions = 0;
  let deletions = 0;
  for (const line of diffText.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) insertions++;
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  }
  return { insertions, deletions };
}

export function getResultDiff(result: { metadata?: Record<string, unknown> }): string | undefined {
  const diff = result.metadata?.diff;
  return typeof diff === 'string' && diff.length > 0 ? diff : undefined;
}

export function DiffStats({ insertions, deletions }: { insertions: number; deletions: number }) {
  return [
    h('div', { class: 'flex items-center text-emerald-600 dark:text-emerald-400' }, [
      h(Plus, { class: 'size-2.5 stroke-2' }),
      formatNumber(insertions),
    ]),
    h('div', { class: 'flex items-center text-red-600 dark:text-red-400' }, [
      h(Minus, { class: 'size-2.5 stroke-2' }),
      formatNumber(deletions),
    ]),
  ];
}

export function ToolCallGroupList({
  calls,
  label,
  renderItem,
  inline,
}: {
  calls: ToolCallWithResult[];
  label: any;
  renderItem: (item: ToolCallWithResult) => any;
  inline?: boolean;
}) {
  return h('div', { class: 'flex flex-col w-full' }, [
    h('div', { class: 'flex flex-row gap-x-2 w-full max-w-full items-center' }, [
      ToolStateIcon({ states: calls.map((item) => item.result?.state) }),
      label,
    ]),
    h('div', { class: `flex ${inline ? 'flex-row flex-wrap' : 'flex-col'} gap-x-2 pl-6 max-w-full` }, [
      ...calls.map((item, index) =>
        h('div', { key: item.call.id, class: 'flex flex-row gap-x-2 w-full max-w-full items-stretch' }, [
          inline
            ? h('span', { class: 'text-muted-foreground shrink-0 w-3' }, index === calls.length - 1 ? '└─' : '├─')
            : TreeLine({ index, total: calls.length }),
          h('div', { class: 'truncate flex-1 min-w-0 text-sm' }, renderItem(item)),
        ]),
      ),
    ]),
  ]);
}
