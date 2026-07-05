import { h } from 'vue';
import type { ToolCallBlock } from '@agentscope-ai/agentscope/message';
import type { TFunction, ToolCallWithResult, ToolRenderer } from './types';
import { ToolCallGroupList } from './_shared';

function parseInput(input: string): Record<string, unknown> {
  try { return JSON.parse(input); } catch { return {}; }
}

function getPattern(input: string): string {
  const { pattern } = parseInput(input) as { pattern?: string };
  return pattern || input;
}

export const GrepRenderer: ToolRenderer = {
  getDisplayName: (_call: ToolCallBlock, t: TFunction) => t('tool.grep.name'),

  renderCallArgs: (call: ToolCallBlock) => getPattern(call.input),

  renderGroup: (calls: ToolCallWithResult[], t: TFunction) =>
    ToolCallGroupList({
      calls,
      inline: true,
      label: h('strong', { class: 'truncate text-primary text-sm' }, t('tool.grep.name')),
      renderItem: (item: ToolCallWithResult) => getPattern(item.call.input),
    }),
};
