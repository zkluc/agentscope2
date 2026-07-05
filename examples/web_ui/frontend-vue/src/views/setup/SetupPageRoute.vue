<script setup lang="ts">
import { useRouter } from 'vue-router';
import SetupPage from './index.vue';

const router = useRouter();

function handleComplete() {
  router.push('/chat');
}
</script>

<template>
  <div class="h-screen">
    <SetupPage @complete="handleComplete" />
  </div>
</template>
