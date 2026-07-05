<template>
  <div class="knowledge-documents">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium">{{ t('knowledge.documents') }}</h3>
      <ElButton size="small" type="primary" @click="handleUpload">
        <Upload class="size-3 mr-1" /> {{ t('knowledge.upload') }}
      </ElButton>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      class="hidden"
      @change="handleFileChange"
    />

    <ElTable v-if="documents.length > 0" :data="documents" stripe size="small">
      <ElTableColumn prop="filename" :label="t('knowledge.filename')" min-width="150" />
      <ElTableColumn prop="status" :label="t('knowledge.status')" width="100">
        <template #default="{ row }">
          <ElTag :type="statusType(row.status)" size="small">{{ row.status }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn :label="t('knowledge.chunks')" width="80">
        <template #default="{ row }">{{ row.chunk_count }}</template>
      </ElTableColumn>
      <ElTableColumn :label="t('knowledge.created')" width="150">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </ElTableColumn>
      <ElTableColumn :label="t('common.actions')" width="80">
        <template #default="{ row }">
          <ElButton size="small" type="danger" text @click="handleDeleteDoc(row)">
            <Trash2 class="size-3" />
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <div v-else-if="loading" class="text-center py-8 text-sm text-muted-foreground">
      {{ t('common.loading') }}
    </div>

    <ElEmpty v-else :description="t('knowledge.noDocuments')" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElButton, ElTable, ElTableColumn, ElTag, ElEmpty, ElMessage } from 'element-plus';
import { Upload, Trash2 } from 'lucide-vue-next';
import { knowledgeBaseApi } from '@/api';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  knowledgeBaseId: string;
}>();

const { t } = useTranslation();
const documents = ref<any[]>([]);
const loading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const statusType = (status: string) => {
  switch (status) {
    case 'ready': return 'success';
    case 'error': return 'danger';
    case 'pending':
    case 'parsing':
    case 'chunking':
    case 'indexing': return 'warning';
    default: return 'info';
  }
};

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString(); } catch { return dateStr; }
}

onMounted(async () => {
  await fetchDocuments();
});

async function fetchDocuments() {
  loading.value = true;
  try {
    const res = await knowledgeBaseApi.listDocuments(props.knowledgeBaseId);
    documents.value = res.documents || [];
  } catch {
    documents.value = [];
  } finally {
    loading.value = false;
  }
}

function handleUpload() {
  fileInput.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  loading.value = true;
  try {
    for (const file of Array.from(input.files)) {
      await knowledgeBaseApi.uploadDocument(props.knowledgeBaseId, file);
    }
    ElMessage.success(t('knowledge.uploadSuccess'));
    await fetchDocuments();
  } catch {
    ElMessage.error(t('knowledge.uploadError'));
  } finally {
    loading.value = false;
    input.value = '';
  }
}

async function handleDeleteDoc(doc: any) {
  try {
    await knowledgeBaseApi.deleteDocument(props.knowledgeBaseId, doc.id);
    ElMessage.success(t('knowledge.deleteSuccess'));
    await fetchDocuments();
  } catch {
    ElMessage.error(t('knowledge.deleteError'));
  }
}
</script>
