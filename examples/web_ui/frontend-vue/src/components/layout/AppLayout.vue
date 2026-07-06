<template>
  <div class="flex h-full w-full">
    <AppSidebar />
    <main class="flex-1 overflow-hidden flex flex-col">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue';
</script>
