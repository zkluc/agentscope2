<template>
  <SetupPage @complete="handleComplete" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import SetupPage from './index.vue';

const router = useRouter();

function handleComplete() {
  router.push('/');
}
</script>
