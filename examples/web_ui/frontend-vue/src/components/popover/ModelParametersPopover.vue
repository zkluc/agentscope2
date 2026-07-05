<template>
  <ElPopover trigger="click" placement="bottom" :width="300">
    <template #reference>
      <ElButton size="small" circle :disabled="!selectedModel">
        <Settings2 class="size-4" />
      </ElButton>
    </template>
    <div class="space-y-3">
      <h4 class="text-sm font-medium">{{ t('modelParams.title') }}</h4>
      <div v-if="selectedModel" class="space-y-2">
        <div class="text-xs text-muted-foreground">
          {{ t('modelParams.model') }}: {{ selectedModel.model }}
        </div>
        <div class="text-xs text-muted-foreground">
          {{ t('modelParams.provider') }}: {{ selectedModel.type }}
        </div>
        <ElDivider />
        <div class="space-y-2">
          <label class="text-xs">{{ t('modelParams.temperature') }}</label>
          <ElSlider v-model="temperature" :min="0" :max="2" :step="0.1" />
        </div>
        <div class="space-y-2">
          <label class="text-xs">{{ t('modelParams.maxTokens') }}</label>
          <ElInputNumber v-model="maxTokens" :min="1" :max="32768" size="small" class="w-full" />
        </div>
        <ElDivider />
        <h5 class="text-xs font-medium">{{ t('modelParams.fallbackModel') }}</h5>
        <ElSelect
          v-model="fallbackModelStr"
          :placeholder="t('modelParams.noFallback')"
          size="small"
          class="w-full"
          clearable
          @change="handleFallbackChange"
        >
          <ElOption
            v-for="group in Object.entries(groups)"
            :key="group[0]"
            :label="group[0]"
            :value="group[0]"
          />
        </ElSelect>
        <ElDivider />
        <h5 class="text-xs font-medium">{{ t('modelParams.ttsModel') }}</h5>
        <ElSelect
          v-model="ttsModelStr"
          :placeholder="t('modelParams.noTTS')"
          size="small"
          class="w-full"
          clearable
        >
          <ElOption label="(disabled)" value="" />
        </ElSelect>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElPopover, ElButton, ElDivider, ElSlider, ElInputNumber, ElSelect, ElOption } from 'element-plus';
import { Settings2 } from 'lucide-vue-next';
import type { ChatModelConfig } from '@/api';
import { useTranslation } from '@/i18n/useI18n';
import { useAvailableModels } from '@/composables/useAvailableModels';

const props = defineProps<{
  selectedModel: ChatModelConfig | null;
  modelCard: any;
  onChange: (params: Record<string, unknown>) => void;
  selectedFallbackModel: ChatModelConfig | null;
  onFallbackChange: (config: ChatModelConfig | null) => void;
  selectedTTSModel: any;
  onTTSChange: (config: any) => void;
}>();

const { t } = useTranslation();
const { groups } = useAvailableModels();
const temperature = ref(0.7);
const maxTokens = ref(4096);
const fallbackModelStr = ref('');
const ttsModelStr = ref('');

function handleFallbackChange(val: string) {
  if (!val) {
    props.onFallbackChange(null);
    return;
  }
  const group = groups.value[val];
  if (group && group.length > 0 && group[0].models.length > 0) {
    const model = group[0].models[0];
    props.onFallbackChange({
      type: val,
      credential_id: group[0].credential.id,
      model: (model as any).name || model.name || '',
      parameters: {},
    });
  }
}
</script>
