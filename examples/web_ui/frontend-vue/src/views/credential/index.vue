<template>
  <div class="flex-1 overflow-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">{{ t('credential.title') }}</h1>
      <ElButton type="primary" @click="createOpen = true">
        <Plus class="size-4 mr-1" /> {{ t('credential.create') }}
      </ElButton>
    </div>

    <ElTable v-if="(credentials as any).length > 0" :data="credentials as any" stripe style="width: 100%">
      <ElTableColumn prop="id" :label="t('credential.id')" min-width="200" />
      <ElTableColumn :label="t('credential.type')" min-width="150">
        <template #default="{ row }">
          {{ (row.data as any)?.type || '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn :label="t('credential.created')" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </ElTableColumn>
      <ElTableColumn :label="t('common.actions')" width="140">
        <template #default="{ row }">
          <ElButton size="small" text @click="handleEdit(row)">
            <Pencil class="size-4" />
          </ElButton>
          <ElButton size="small" type="danger" text @click="handleDelete(row)">
            <Trash2 class="size-4" />
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElEmpty v-else :description="t('credential.empty')" />

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
import { ElTable, ElTableColumn, ElButton, ElEmpty, ElMessageBox, ElMessage } from 'element-plus';
import { Plus, Trash2, Pencil } from 'lucide-vue-next';
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
