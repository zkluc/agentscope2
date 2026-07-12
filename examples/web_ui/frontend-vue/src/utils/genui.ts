/**
 * GenUI 工具函数
 * 用于处理 GenUI schema 的解析、验证和转换
 */

export interface GenUISchema {
  componentName: string;
  props?: Record<string, any>;
  children?: GenUISchema[];
  state?: Record<string, any>;
  methods?: Record<string, any>;
  css?: string;
}

export interface GenUIContentBlock {
  type: 'genui';
  schema: string | GenUISchema;
  state?: Record<string, any>;
}

/**
 * 解析 GenUI schema 字符串
 */
export function parseGenUISchema(schema: string | GenUISchema): GenUISchema | null {
  try {
    if (typeof schema === 'string') {
      return JSON.parse(schema) as GenUISchema;
    }
    return schema;
  } catch (error) {
    console.error('Failed to parse GenUI schema:', error);
    return null;
  }
}

/**
 * 验证 GenUI schema 格式
 */
export function validateGenUISchema(schema: any): boolean {
  if (!schema || typeof schema !== 'object') {
    return false;
  }

  if (!schema.componentName || typeof schema.componentName !== 'string') {
    return false;
  }

  if (schema.children && !Array.isArray(schema.children)) {
    return false;
  }

  if (schema.props && typeof schema.props !== 'object') {
    return false;
  }

  return true;
}

/**
 * 检查消息是否包含 GenUI 内容
 */
export function hasGenUIContent(content: any[]): boolean {
  if (!Array.isArray(content)) {
    return false;
  }

  return content.some(
    (block) => block.type === 'genui' && block.schema
  );
}

/**
 * 从消息内容中提取 GenUI schema
 */
export function extractGenUISchema(content: any[]): GenUISchema | null {
  if (!Array.isArray(content)) {
    return null;
  }

  const genuiBlock = content.find(
    (block) => block.type === 'genui' && block.schema
  );

  if (!genuiBlock) {
    return null;
  }

  return parseGenUISchema(genuiBlock.schema);
}

/**
 * 创建 GenUI 内容块
 */
export function createGenUIBlock(
  schema: GenUISchema | string,
  state?: Record<string, any>
): GenUIContentBlock {
  return {
    type: 'genui',
    schema,
    state,
  };
}

/**
 * 合并 GenUI schema
 */
export function mergeGenUISchemas(
  base: GenUISchema,
  override: Partial<GenUISchema>
): GenUISchema {
  return {
    ...base,
    ...override,
    props: {
      ...base.props,
      ...override.props,
    },
    children: override.children || base.children,
  };
}

/**
 * 生成默认的 GenUI schema
 */
export function createDefaultGenUISchema(
  componentName: string = 'Page',
  children: GenUISchema[] = []
): GenUISchema {
  return {
    componentName,
    children,
    props: {},
  };
}

/**
 * 从文本生成简单的 GenUI schema
 */
export function textToGenUISchema(text: string): GenUISchema {
  return createDefaultGenUISchema('Page', [
    {
      componentName: 'Text',
      props: {
        text,
      },
    },
  ]);
}

/**
 * 检查是否需要生成 UI
 */
export function shouldGenerateUI(userMessage: string): boolean {
  const uiKeywords = [
    '生成界面',
    '创建表单',
    '显示图表',
    'UI',
    '界面',
    '表单',
    '图表',
    '按钮',
    '输入框',
    '表格',
    '列表',
    '卡片',
    '生成',
    '创建',
    '显示',
  ];

  const lowerMessage = userMessage.toLowerCase();
  return uiKeywords.some((keyword) => lowerMessage.includes(keyword.toLowerCase()));
}
