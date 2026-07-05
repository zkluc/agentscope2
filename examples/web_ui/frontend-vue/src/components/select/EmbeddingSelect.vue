<template>
  <ElSelect
    :model-value="modelValue"
    :placeholder="t('kb.embedding.placeholder')"
    size="small"
    class="w-full"
    @change="$emit('update:modelValue', $event)"
  >
    <ElOptionGroup
      v-for="group in providerGroups"
      :key="group.label"
      :label="group.label"
    >
      <ElOption
        v-for="item in group.options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </ElOptionGroup>
  </ElSelect>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElSelect, ElOption, ElOptionGroup } from 'element-plus';
import type { KbEmbeddingProvider } from '@/api';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  modelValue: string | null;
  providers: KbEmbeddingProvider[];
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useTranslation();

const providerGroups = computed(() =>
  props.providers.map((p) => ({
    label: p.credential.id,
    options: p.models.map((m) => ({
      label: `${m.label || m.name} (${m.dimensions}d)`,
      value: `${p.credential.id}:${m.name}`,
    })),
  })),
);
</script>
