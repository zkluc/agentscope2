<template>
  <div class="flex flex-row gap-x-1">
    <ElTooltip
      v-for="mod in modalities"
      :key="mod.mainType"
      :content="supportedTooltip(mod)"
    >
      <Component
        :is="mod.icon"
        :size="18"
        :class="hasMatch(mod) ? 'stroke-primary' : 'opacity-30'"
      />
    </ElTooltip>
  </div>
</template>

<script setup lang="ts">
import { ElTooltip } from 'element-plus';
import { Type, Image, Video, AudioLines } from 'lucide-vue-next';
import type { Component } from 'vue';

const props = defineProps<{
  inputTypes: string[];
}>();

interface ModalityConfig {
  mainType: string;
  icon: Component;
  label: string;
  exactMatch?: string;
}

const modalities: ModalityConfig[] = [
  { mainType: 'text', exactMatch: 'text/plain', icon: Type, label: 'text/plain' },
  { mainType: 'image', icon: Image, label: 'image' },
  { mainType: 'video', icon: Video, label: 'video' },
  { mainType: 'audio', icon: AudioLines, label: 'audio' },
];

function hasMatch(mod: ModalityConfig): boolean {
  return mod.exactMatch
    ? props.inputTypes.filter((t) => t === mod.exactMatch).length > 0
    : props.inputTypes.filter((t) => t.startsWith(mod.mainType + '/')).length > 0;
}

function supportedTooltip(mod: ModalityConfig): string {
  const matched = mod.exactMatch
    ? props.inputTypes.filter((t) => t === mod.exactMatch)
    : props.inputTypes.filter((t) => t.startsWith(mod.mainType + '/'));
  return matched.length > 0 ? matched.join(', ') : mod.label;
}
</script>
