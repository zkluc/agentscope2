<template>
  <ElForm label-position="top" class="schema-form">
    <ElFormItem
      v-for="(prop, key) in properties"
      :key="key"
      :label="prop.title || key"
      :required="requiredFields.includes(key as string)"
    >
      <ElInput
        v-if="prop.type === 'string' && prop.format !== 'textarea'"
        v-model="model[key as string]"
        :placeholder="prop.description || ''"
      />
      <ElInput
        v-else-if="prop.type === 'string' && prop.format === 'textarea'"
        v-model="model[key as string]"
        type="textarea"
        :rows="3"
        :placeholder="prop.description || ''"
      />
      <ElInputNumber
        v-else-if="prop.type === 'number' || prop.type === 'integer'"
        v-model="model[key as string]"
        :min="prop.minimum"
        :max="prop.maximum"
        class="w-full"
      />
      <ElCheckbox
        v-else-if="prop.type === 'boolean'"
        v-model="(model as any)[key as string]"
      />
      <ElSelect
        v-else-if="prop.enum"
        v-model="model[key as string]"
        class="w-full"
      >
        <ElOption
          v-for="opt in prop.enum"
          :key="opt as string"
          :label="opt as string"
          :value="opt as string | number"
        />
      </ElSelect>
      <ElInput
        v-else
        v-model="model[key as string]"
        :placeholder="prop.description || ''"
      />
    </ElFormItem>
  </ElForm>
</template>

<script setup lang="ts">
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElCheckbox, ElSelect, ElOption } from 'element-plus';
import type { JSONSchemaProperty } from '@/api';

interface SchemaFormProps {
  schema: Record<string, JSONSchemaProperty>;
  model: Record<string, any>;
  requiredFields?: string[];
}

const props = defineProps<SchemaFormProps>();
const properties = props.schema;
const requiredFields = props.requiredFields || [];
</script>
