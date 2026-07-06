<template>
  <div class="flex-1 overflow-auto">
    <div class="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
      <div class="flex items-center justify-between px-6 py-4">
        <div>
          <h1 class="text-lg font-semibold text-foreground">{{ t('credential.title') }}</h1>
          <p class="text-xs text-muted-foreground mt-0.5">{{ t('credential.subtitle') }}</p>
        </div>
        <ElButton type="primary" @click="createOpen = true">
          <Plus class="size-4 mr-1.5" /> {{ t('credential.create') }}
        </ElButton>
      </div>
    </div>

    <div class="p-6">
      <div v-if="(credentials as any).length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="cred in (credentials as any)"
          :key="cred.id"
          class="group relative rounded-xl border bg-card p-4 hover:shadow-sm transition-all duration-150"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="mt-0.5 size-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                <KeyRound class="size-4 text-primary" />
              </div>
              <div class="min-w-0">
                <div class="font-medium text-sm text-foreground truncate">{{ cred.id }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                    <Key class="size-3" />
                    {{ (cred.data as any)?.type || '-' }}
                  </span>
                </div>
                <div class="text-xs text-muted-foreground mt-2">
                  {{ formatDate(cred.created_at) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <ElButton size="small" text @click="handleEdit(cred)">
                <Pencil class="size-3.5" />
              </ElButton>
              <ElButton size="small" text @click="handleDelete(cred)">
                <Trash2 class="size-3.5 text-destructive" />
              </ElButton>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-24 text-center">
        <div class="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <KeyRound class="size-6 text-muted-foreground" />
        </div>
        <p class="text-sm text-muted-foreground">{{ t('credential.empty') }}</p>
        <ElButton type="primary" class="mt-4" @click="createOpen = true">
          <Plus class="size-4 mr-1.5" /> {{ t('credential.create') }}
        </ElButton>
      </div>
    </div>

    <CreateCredentialDialog
      :open="createOpen"
      :on-open-change="(v: boolean) => createOpen = v"
      :on-created="refetch"
    />

    <EditCredentialDialog
      :open="editOpen"
      :credential="editTarget"
      @update:open="editOpen = $event"
      :on-updated="refetch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElMessageBox, ElMessage } from 'element-plus';
import { Plus, Trash2, Pencil, KeyRound, Key } from 'lucide-vue-next';
import { useCredentials } from '@/composables/useCredentials';
import { credentialApi } from '@/api';
import type { CredentialRecord } from '@/api';
import CreateCredentialDialog from '@/components/dialog/CreateCredentialDialog.vue';
import EditCredentialDialog from '@/components/dialog/EditCredentialDialog.vue';
import { useTranslation } from '@/i18n/useI18n';

const { t } = useTranslation();
const { credentials, refetch } = useCredentials();
const createOpen = ref(false);
const editOpen = ref(false);
const editTarget = ref<CredentialRecord | null>(null);

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function handleEdit(credential: any) {
  editTarget.value = credential as CredentialRecord;
  editOpen.value = true;
}

async function handleDelete(credential: any) {
  try {
    await ElMessageBox.confirm(t('credential.deleteConfirm'), t('common.confirm'), {
      type: 'warning',
    });
    await credentialApi.delete(credential.id);
    ElMessage.success(t('credential.deleteSuccess'));
    refetch();
  } catch {
    // cancelled or error
  }
}
</script>
