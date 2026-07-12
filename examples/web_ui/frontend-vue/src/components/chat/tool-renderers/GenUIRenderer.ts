import type { ToolCallBlock, ToolResultBlock } from '@agentscope-ai/agentscope/message';
import type { TFunction } from './types';

function extractOutputText(result: ToolResultBlock): string {
  const output = (result as any).output;
  if (Array.isArray(output)) {
    return output
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');
  }
  if (typeof output === 'string') return output;
  return '';
}

function parseGenUI(result: ToolResultBlock): { type: string; schema: any; message?: string } | null {
  try {
    const text = extractOutputText(result);
    const parsed = JSON.parse(text);
    if (parsed.type === 'genui' && parsed.schema) {
      return { type: 'genui', schema: parsed.schema, message: parsed.message };
    }
  } catch {
    // parse failure
  }
  return null;
}

export const GenUIRenderer = {
  getDisplayName(_call: ToolCallBlock, _t: TFunction): string {
    return 'GenUI';
  },

  renderResult(
    _call: ToolCallBlock,
    result: ToolResultBlock,
    _t: TFunction,
  ): string | null {
    const gen = parseGenUI(result);
    return gen?.message ?? null;
  },
};

export default GenUIRenderer;
