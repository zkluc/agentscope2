import type { ToolCallBlock, ToolResultBlock } from '@agentscope-ai/agentscope/message';
import type { VNode } from 'vue';

export type TFunction = (key: string, params?: Record<string, unknown>) => string;

export interface ToolCallWithResult {
  call: ToolCallBlock;
  result?: ToolResultBlock;
}

export interface ToolRenderer {
  getDisplayName?: (call: ToolCallBlock, t: TFunction) => string;
  renderCallArgs?: (call: ToolCallBlock, t: TFunction) => VNode | string | null;
  renderResult?: (call: ToolCallBlock, result: ToolResultBlock, t: TFunction) => VNode | string | null;
  renderConfirmBody?: (call: ToolCallBlock, t: TFunction) => VNode | string | null;
  renderGroup?: (calls: ToolCallWithResult[], t: TFunction) => VNode | string | null;
}
