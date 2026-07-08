import { h } from 'vue';
import type { ToolCallBlock, ToolResultBlock } from '@agentscope-ai/agentscope/message';
import type { TFunction, ToolCallWithResult, ToolRenderer } from './types';
import {
  defaultGetDisplayName,
  defaultRenderCallArgs,
  defaultRenderGroup,
  defaultRenderResult,
} from './DefaultRenderer';

function parseInput(input: string): Record<string, unknown> {
  try { return JSON.parse(input); } catch { return {}; }
}

export const BashRenderer: ToolRenderer = {
  getDisplayName: (_call: ToolCallBlock, t: TFunction) => t('tool.bash.name'),

  renderCallArgs: (call: ToolCallBlock) => {
    const { command } = parseInput(call.input) as { command?: string };
    return command || call.input;
  },

  renderResult: (_call: ToolCallBlock, result: ToolResultBlock, t: TFunction) => {
    if (!result || result.state === 'running') {
      return t('common.running');
    }
    if (result.state === 'interrupted') {
      return t('common.interrupted');
    }
    return null;
  },

  renderConfirmBody: (call: ToolCallBlock) => {
    const { command, description } = parseInput(call.input) as { command?: string; description?: string };
    return h('div', { class: 'w-full max-w-full overflow-hidden text-ellipsis truncate' }, [
      h('div', { class: 'text-secondary-foreground font-mono' }, command),
      description ? h('div', { class: 'text-muted-foreground' }, description) : null,
    ]);
  },

  renderGroup: (calls: ToolCallWithResult[], t: TFunction) =>
    defaultRenderGroup(calls, t, {
      getDisplayName: (call: ToolCallBlock) => BashRenderer.getDisplayName?.(call, t) ?? defaultGetDisplayName(call),
      renderCallArgs: (call: ToolCallBlock) => (BashRenderer as any).renderCallArgs?.(call) ?? defaultRenderCallArgs(call, t),
      renderResult: (call: ToolCallBlock, result: ToolResultBlock) =>
        (BashRenderer as any).renderResult?.(call, result, t) ?? defaultRenderResult(call, result, t),
    }),
};
