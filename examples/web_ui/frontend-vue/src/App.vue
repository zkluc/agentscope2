<template>
  <ElConfigProvider :locale="elLocale">
    <SetupPage v-if="!setupComplete" @complete="handleComplete" />
    <div v-else class="h-screen w-screen flex overflow-hidden bg-background text-foreground">
      <router-view />
    </div>
  </ElConfigProvider>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import SetupPage from '@/views/setup/index.vue';

const { locale } = useI18n();

const elLocale = computed(() => (locale.value === 'zh' ? zhCn : en));

const setupComplete = ref(!!localStorage.getItem('server_url'));

function handleComplete() {
  setupComplete.value = true;
}
</script>
