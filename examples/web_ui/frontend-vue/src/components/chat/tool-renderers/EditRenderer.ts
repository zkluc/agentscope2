import { h } from 'vue';
import unidiff from 'unidiff';
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
  parseInput,
  tryGetFileName,
} from './_shared';

function countLineChanges(oldText: string, newText: string): { insertions: number; deletions: number } {
  const diffText = unidiff.diffAsText(oldText, newText, { context: 0 });
  return countDiffStats(diffText);
}

function renderEditDiff(result: ToolResultBlock) {
  const unifiedDiff = getResultDiff(result as any);
  if (!unifiedDiff) return null;
  return h(DiffPreview, { unifiedDiff });
}

export const EditRenderer: ToolRenderer = {
  getDisplayName: (_call: ToolCallBlock, t: TFunction) => t('tool.edit.name'),

  renderCallArgs: (call: ToolCallBlock) => {
    const fileName = tryGetFileName(call.input);
    if (!fileName) return h('span');
    const input = parseInput(call.input);
    const oldString = typeof input.old_string === 'string' ? input.old_string : '';
    const newString = typeof input.new_string === 'string' ? input.new_string : '';
    const { insertions, deletions } = countLineChanges(oldString, newString);

    return h('div', { class: 'flex items-center gap-2 font-normal' }, [
      fileName,
      DiffStats({ insertions, deletions }),
    ]);
  },

  renderConfirmBody: (call: ToolCallBlock) =>
    h('div', { class: 'w-full max-w-full overflow-hidden text-ellipsis truncate' }, [
      h('div', { class: 'text-secondary-foreground' }, getFilePath(call.input)),
    ]),

  renderGroup: (calls: ToolCallWithResult[], t: TFunction) =>
    defaultRenderGroup(calls, t, {
      getDisplayName: (call: ToolCallBlock) =>
        EditRenderer.getDisplayName?.(call, t) ?? defaultGetDisplayName(call),
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
        return (EditRenderer as any).renderCallArgs?.(call) ?? defaultRenderCallArgs(call, t);
      },
      renderResult: (call: ToolCallBlock, result: ToolResultBlock) =>
        (result.state === 'success' ? renderEditDiff(result) : null) ??
        (EditRenderer as any).renderResult?.(call, result, t) ??
        defaultRenderResult(call, result, t),
    }),
};
