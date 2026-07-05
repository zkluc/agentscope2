<template>
  <div class="flex flex-1 flex-col items-center justify-center p-4 border-0">
    <component :is="icon" class="size-8 text-muted-foreground mb-3" />
    <p class="text-sm font-medium text-muted-foreground">{{ title }}</p>
    <p v-if="description" class="text-xs text-muted-foreground mt-1">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  icon: Component;
  title: string;
  description?: string;
}>();
</script>
