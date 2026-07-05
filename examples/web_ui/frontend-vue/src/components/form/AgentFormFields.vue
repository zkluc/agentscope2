<template>
  <div>
    <div v-for="(section, idx) in sections" :key="section.key">
      <div v-if="idx > 0" class="my-4 border-t" />
      <fieldset>
        <legend class="text-sm font-semibold mb-1">{{ sectionLabel(section) }}</legend>
        <p v-if="sectionDesc(section)" class="text-xs text-muted-foreground mb-3">
          {{ sectionDesc(section) }}
        </p>
        <SchemaForm
          :schema="sectionProperties(section.key)"
          :model="(values as any)[section.key]"
        />
      </fieldset>
    </div>
  </div>
</template>

<script setup lang="ts">
import SchemaForm from '@/components/form/SchemaForm.vue';
import { useTranslation } from '@/i18n/useI18n';
import type { AgentFormValues } from './AgentFormFields';

const props = defineProps<{
  schema: any;
  values: AgentFormValues;
}>();

const { t } = useTranslation();

const sections: { key: string; i18n: string }[] = [
  { key: 'identity', i18n: 'identity' },
  { key: 'context_config', i18n: 'context-config' },
  { key: 'react_config', i18n: 'react-config' },
];

function sectionProperties(key: string): Record<string, any> {
  return (props.schema as any)?.[key]?.properties ?? {};
}

function sectionLabel(section: { key: string; i18n: string }): string {
  const sectionSchema = (props.schema as any)[section.key];
  return t(`agent-form.${section.i18n}.legend`, { defaultValue: sectionSchema?.title ?? section.key });
}

function sectionDesc(section: { key: string; i18n: string }): string {
  return t(`agent-form.${section.i18n}.description`, { defaultValue: '' });
}
</script>
