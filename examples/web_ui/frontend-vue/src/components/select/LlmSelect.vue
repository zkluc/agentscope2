<template>
  <ElSelect
    :model-value="selectedValue"
    :placeholder="loading ? t('llm-select.loading') : t('llm-select.placeholder')"
    :loading="loading"
    size="small"
    class="min-w-48"
    popper-class="llm-select-popper"
    @change="handleChange"
  >
    <template v-if="hasOptions">
      <ElOptionGroup
        v-for="[type, items] in Object.entries(groups)"
        :key="type"
        :label="type.replace(/_credential$/, '')"
      >
        <template v-for="{ credential, models } in items" :key="credential.id">
          <ElOption
            v-for="m in models"
            :key="`${credential.id}:${m.name}`"
            :label="items.length > 1 ? `${m.label} (${credential.data.name || credential.id.slice(0, 8)})` : m.label"
            :value="`${type}:${credential.id}:${m.name}`"
          >
            <template #default>
              <div class="flex items-center gap-2">
                <span>{{ m.label }}</span>
                <span v-if="items.length > 1" class="text-xs text-muted-foreground">
                  {{ credential.data.name || credential.id.slice(0, 8) }}
                </span>
              </div>
            </template>
          </ElOption>
        </template>
      </ElOptionGroup>
    </template>
    <template #empty>
      <div class="p-4 text-center text-sm text-muted-foreground">
        <p class="font-medium">{{ t('llm-select.empty.title') }}</p>
        <p class="text-xs mt-1">{{ t('llm-select.empty.description') }}</p>
        <ElButton size="small" class="mt-2" @click="$emit('addCredential')">
          {{ t('llm-select.addCredential') }}
        </ElButton>
      </div>
    </template>
  </ElSelect>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { ElSelect, ElOption, ElOptionGroup, ElButton } from 'element-plus';
import type { ChatModelConfig } from '@/api';
import { useTranslation } from '@/i18n/useI18n';
import { useAvailableModels } from '@/composables/useAvailableModels';

const props = defineProps<{
  value: ChatModelConfig | null;
  onChange: (config: ChatModelConfig | null) => void;
  onAddCredential: () => void;
  refetchTrigger: number;
}>();

const { t } = useTranslation();
const { groups, loading, refetch } = useAvailableModels();

watch(() => props.refetchTrigger, (v) => {
  if (v > 0) refetch();
});

const hasOptions = computed(() => Object.keys(groups.value).length > 0);

const selectedValue = computed(() => {
  if (!props.value) return '';
  return `${props.value.type}:${props.value.credential_id}:${props.value.model}`;
});

function handleChange(val: string) {
  if (!val) {
    props.onChange(null);
    return;
  }
  const parts = val.split(':');
  if (parts.length < 3) return;
  props.onChange({
    type: parts[0],
    credential_id: parts[1],
    model: parts.slice(2).join(':'),
    parameters: {},
  });
}
</script>
