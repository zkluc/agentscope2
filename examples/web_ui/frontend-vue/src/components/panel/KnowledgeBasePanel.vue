<template>
  <div class="text-sm space-y-2">
    <div v-if="loading" class="text-center text-muted-foreground">
      <Loader2 class="animate-spin inline" />
    </div>
    <div v-else-if="knowledgeBases.length === 0" class="text-muted-foreground">
      <p>{{ t('panel.knowledge.empty') }}</p>
    </div>
    <div v-else class="space-y-1">
      <div
        v-for="kb in knowledgeBases"
        :key="kb.id"
        :class="['flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-muted', isSelected(kb.id) ? 'bg-muted' : '']"
        @click="toggleKb(kb.id)"
      >
        <ElCheckbox :model-value="isSelected(kb.id)" />
        <span class="truncate">{{ kb.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElCheckbox } from 'element-plus';
import { Loader2 } from 'lucide-vue-next';
import type { SessionKnowledgeConfig, KnowledgeBaseView } from '@/api';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  knowledgeBases: KnowledgeBaseView[];
  loading: boolean;
  value: SessionKnowledgeConfig | null;
  onChange: (config: SessionKnowledgeConfig | null) => void;
  disabled: boolean;
}>();

const { t } = useTranslation();

function isSelected(id: string): boolean {
  return props.value?.knowledge_base_ids?.includes(id) ?? false;
}

function toggleKb(id: string) {
  const current = props.value?.knowledge_base_ids || [];
  const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
  props.onChange(next.length > 0 ? { knowledge_base_ids: next, parameters: props.value?.parameters || {} } : null);
}
</script>
