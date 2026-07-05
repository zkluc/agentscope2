<template>
  <ElPopover trigger="click" placement="bottom" :width="250">
    <template #reference>
      <ElButton size="small" circle :disabled="disabled">
        <Settings2 class="size-3" />
      </ElButton>
    </template>
    <div class="space-y-2">
      <h4 class="text-sm font-medium">{{ t('kbParams.title') }}</h4>
      <div class="space-y-2">
        <label class="text-xs">{{ t('kbParams.topK') }}</label>
        <ElInputNumber v-model="topKVal" :min="1" :max="50" size="small" class="w-full" />
      </div>
      <div class="space-y-2">
        <label class="text-xs">{{ t('kbParams.scoreThreshold') }}</label>
        <ElSlider v-model="scoreThresholdVal" :min="0" :max="1" :step="0.05" />
      </div>
      <ElButton size="small" type="primary" class="w-full" @click="saveParams">
        {{ t('common.save') }}
      </ElButton>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElPopover, ElButton, ElInputNumber, ElSlider } from 'element-plus';
import { Settings2 } from 'lucide-vue-next';
import type { SessionKnowledgeConfig } from '@/api';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  value: SessionKnowledgeConfig | null;
  schema: any;
  onChange: (config: SessionKnowledgeConfig | null) => void;
  disabled: boolean;
}>();

const { t } = useTranslation();
const topKVal = ref((props.value?.parameters?.top_k as number) ?? 5);
const scoreThresholdVal = ref((props.value?.parameters?.score_threshold as number) ?? 0.5);

function saveParams() {
  const currentIds = props.value?.knowledge_base_ids || [];
  if (currentIds.length > 0) {
    props.onChange({
      knowledge_base_ids: currentIds,
      parameters: { top_k: topKVal.value, score_threshold: scoreThresholdVal.value },
    });
  }
}
</script>
