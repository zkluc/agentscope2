import { h } from 'vue';
import type { ToolCallBlock, ToolResultBlock } from '@agentscope-ai/agentscope/message';
import type { TFunction, ToolCallWithResult, ToolRenderer } from './types';
import DiffPreview from './DiffPreview.vue';
import {
  defaultGetDisplayName,
  defaultRenderCallArgs,
  defaultRenderGroup,
  defaultRenderResult,
} from './DefaultRenderer';
import {
  countDiffStats,
  DiffStats,
  getFilePath,
  getResultDiff,
  tryGetFileName,
} from './_shared';

function isRunning(state: string | undefined): boolean {
  return state === 'running' || state === undefined;
}

export const WriteRenderer: ToolRenderer = {
  getDisplayName: (_call: ToolCallBlock, t: TFunction) => t('tool.write.name'),

  renderCallArgs: (call: ToolCallBlock) => {
    const fileName = tryGetFileName(call.input);
    if (!fileName) return h('span');
    return h('div', { class: 'flex items-center gap-2 font-normal' }, fileName);
  },

  renderConfirmBody: (call: ToolCallBlock) =>
    h('div', { class: 'w-full max-w-full overflow-hidden text-ellipsis truncate' }, [
      h('div', { class: 'text-secondary-foreground' }, getFilePath(call.input)),
    ]),

  renderResult: (_call: ToolCallBlock, result: ToolResultBlock, t: TFunction) => {
    if (result.state === 'success') {
      const unifiedDiff = getResultDiff(result as any);
      if (unifiedDiff) {
        return h(DiffPreview, { unifiedDiff });
      }
      return null;
    }
    if (!result || isRunning(result.state)) {
      return t('common.running');
    }
    if (result.state === 'interrupted') {
      return t('common.interrupted');
    }
    return null;
  },

  renderGroup: (calls: ToolCallWithResult[], t: TFunction) =>
    defaultRenderGroup(calls, t, {
      getDisplayName: (call: ToolCallBlock) =>
        WriteRenderer.getDisplayName?.(call, t) ?? defaultGetDisplayName(call),
      renderCallArgs: (call: ToolCallBlock) => {
        const enriched = calls.find((c) => c.call.id === call.id);
        const resultDiff = enriched?.result
          ? getResultDiff(enriched.result as any)
          : undefined;
        if (resultDiff) {
          const fileName = tryGetFileName(call.input);
          if (!fileName) return null;
          const { insertions, deletions } = countDiffStats(resultDiff);
          return h('div', { class: 'flex items-center gap-2 font-normal' }, [
            fileName,
            DiffStats({ insertions, deletions }),
          ]);
        }
        return (WriteRenderer as any).renderCallArgs?.(call) ?? defaultRenderCallArgs(call, t);
      },
      renderResult: (call: ToolCallBlock, result: ToolResultBlock) =>
        (WriteRenderer as any).renderResult?.(call, result, t) ??
        defaultRenderResult(call, result, t),
    }),
};
