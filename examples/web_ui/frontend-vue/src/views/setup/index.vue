<template>
  <div class="relative flex items-center justify-center h-screen w-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/[0.03]">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.5_0.22_280_/_0.06),_transparent_50%)]" />
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_oklch(0.65_0.12_190_/_0.04),_transparent_50%)]" />

    <div class="relative flex flex-col gap-6 w-full max-w-sm px-4">
      <div class="flex flex-col items-center text-center gap-2">
        <div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot class="size-6 text-primary" />
        </div>
        <h1 class="font-semibold tracking-tight text-2xl text-foreground">{{ t('setup.title') }}</h1>
        <p class="text-sm text-muted-foreground max-w-xs">{{ t('setup.description') }}</p>
      </div>

      <div class="rounded-xl border bg-card shadow-sm">
        <div class="p-6">
          <ElForm label-position="top" @submit.prevent="handleSubmit">
            <ElFormItem :label="t('setup.serverUrl')" required>
              <ElInput
                v-model="url"
                type="url"
                :placeholder="t('setup.serverUrlPlaceholder')"
              />
            </ElFormItem>
            <ElFormItem :label="t('setup.username')" required>
              <ElInput
                v-model="username"
                type="text"
                :placeholder="t('setup.usernamePlaceholder')"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" native-type="submit" class="w-full" :disabled="!url || !username">
                {{ t('setup.submit') }}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </div>
      </div>

      <p class="px-6 text-center text-xs text-muted-foreground">{{ t('setup.hint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElInput, ElButton, ElForm, ElFormItem } from 'element-plus';
import { Bot } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const emit = defineEmits<{
  complete: [];
}>();

const { t } = useTranslation();

const url = ref('');
const username = ref('');

onMounted(() => {
  url.value = localStorage.getItem('server_url') ?? '';
  username.value = localStorage.getItem('username') ?? '';
});

function handleSubmit() {
  if (!url.value || !username.value) return;
  localStorage.setItem('server_url', url.value);
  localStorage.setItem('username', username.value);
  emit('complete');
}
</script>
