import type { AgentSchemaResponse, JSONSchemaProperty } from '@/api';

export type AgentSection = 'identity' | 'context_config' | 'react_config';

export interface AgentFormValues {
  identity: Record<string, any>;
  context_config: Record<string, any>;
  react_config: Record<string, any>;
}

export function defaultAgentFormValues(schema: AgentSchemaResponse): AgentFormValues {
  function fromDefaults(sectionSchema: { properties?: Record<string, JSONSchemaProperty> }): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [k, prop] of Object.entries(sectionSchema.properties ?? {})) {
      if (prop.const !== undefined) continue;
      if (prop.default !== undefined) out[k] = prop.default;
    }
    return out;
  }
  return {
    identity: fromDefaults(schema.identity),
    context_config: fromDefaults(schema.context_config),
    react_config: fromDefaults(schema.react_config),
  };
}
