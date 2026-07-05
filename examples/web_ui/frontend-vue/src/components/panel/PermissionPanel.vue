<template>
  <div v-if="permissionContext" class="text-sm space-y-2">
    <div class="flex items-center gap-2">
      <ShieldCheck class="size-4" />
      <span class="font-medium">{{ t('panel.permission.mode', { mode: permissionContext.mode || 'default' }) }}</span>
    </div>
    <div v-if="rules.length > 0">
      <p class="text-muted-foreground text-xs mb-1">{{ t('panel.permission.rules') }}</p>
      <div v-for="(rule, i) in rules" :key="i" class="text-xs text-muted-foreground">
        {{ rule }}
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-muted-foreground">
    <p>{{ t('panel.permission.empty') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ShieldCheck } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  permissionContext: Record<string, any> | null;
}>();

const { t } = useTranslation();
const rules = computed(() => {
  if (!props.permissionContext?.rules) return [];
  return Array.isArray(props.permissionContext.rules) ? props.permissionContext.rules : [];
});
</script>
