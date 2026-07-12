/**
 * GenUI API 调用示例
 * 用于与后端 GenUI API 进行交互
 */

import type { GenUISchema, GenUIContentBlock } from '@/utils/genui';

export interface ChatResponse {
  type: 'text' | 'genui';
  content: Array<{ type: string; text?: string; schema?: string }>;
  schema?: GenUISchema | string;
}

/**
 * 发送聊天消息并获取 GenUI 响应
 */
export async function sendChatMessage(
  message: string,
  apiUrl: string = '/api/chat'
): Promise<ChatResponse> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw error;
  }
}

/**
 * 流式发送聊天消息
 */
export async function sendChatMessageStream(
  message: string,
  apiUrl: string = '/api/genui/stream',
  onChunk: (chunk: string) => void,
  onComplete: (schema: GenUISchema) => void
): Promise<void> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const lineEndIndex = buffer.indexOf('\n');
        if (lineEndIndex === -1) break;

        const line = buffer.slice(0, lineEndIndex).trim();
        buffer = buffer.slice(lineEndIndex + 1);

        if (!line.startsWith('data: ')) continue;

        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') {
          return;
        }

        try {
          const chunk = JSON.parse(dataStr);
          if (chunk.schema) {
            onComplete(chunk.schema);
          } else if (chunk.content) {
            onChunk(chunk.content);
          }
        } catch (e) {
          console.error('Failed to parse chunk:', e);
        }
      }
    }
  } catch (error) {
    console.error('Failed to send stream message:', error);
    throw error;
  }
}

/**
 * 将 GenUI 响应转换为消息内容块
 */
export function convertResponseToContentBlock(
  response: ChatResponse
): GenUIContentBlock[] {
  const blocks: GenUIContentBlock[] = [];

  if (response.type === 'genui' && response.schema) {
    blocks.push({
      type: 'genui',
      schema: response.schema,
    });
  } else if (response.type === 'text') {
    response.content.forEach((item) => {
      if (item.type === 'text' && item.text) {
        blocks.push({
          type: 'genui',
          schema: {
            componentName: 'Page',
            children: [
              {
                componentName: 'Text',
                props: {
                  text: item.text,
                },
              },
            ],
          },
        });
      }
    });
  }

  return blocks;
}
