<template>
  <div class="flex items-center justify-center h-screen w-screen bg-background text-foreground">
    <div class="flex flex-col gap-6 w-full max-w-sm px-4">
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="font-semibold tracking-tight text-xl">{{ t('setup.title') }}</h3>
          <p class="text-sm text-muted-foreground">{{ t('setup.description') }}</p>
        </div>
        <div class="p-6 pt-0">
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
              <ElButton type="primary" native-type="submit" class="w-full">
                {{ t('setup.submit') }}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </div>
      </div>
      <p class="px-6 text-center text-sm text-muted-foreground">{{ t('setup.hint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElInput, ElButton, ElForm, ElFormItem } from 'element-plus';
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
