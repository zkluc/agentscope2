<template>
  <div class="flex-1 overflow-auto">
    <div class="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
      <div class="flex items-center justify-between px-6 py-4">
        <div>
          <h1 class="text-lg font-semibold text-foreground">{{ t('knowledge.title') }}</h1>
          <p class="text-xs text-muted-foreground mt-0.5">{{ t('knowledge.subtitle') }}</p>
        </div>
        <ElButton type="primary" @click="showCreateDialog = true">
          <Plus class="size-4 mr-1.5" /> {{ t('knowledge.create') }}
        </ElButton>
      </div>
    </div>

    <div class="p-6">
      <div v-if="knowledgeBases.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="kb in knowledgeBases"
          :key="kb.id"
          class="group rounded-xl border bg-card p-5 hover:shadow-sm transition-all duration-150"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="mt-0.5 size-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <Database class="size-4 text-secondary" />
              </div>
              <div class="min-w-0">
                <h3 class="font-medium text-sm text-foreground">{{ kb.name }}</h3>
                <p v-if="kb.description" class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ kb.description }}</p>
              </div>
            </div>
            <ElDropdown trigger="click" @command="(cmd: string) => handleAction(cmd, kb)">
              <ElButton size="small" text class="-mr-1.5">
                <Ellipsis class="size-4" />
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="search">
                    <Search class="size-3.5 mr-2" /> {{ t('knowledge.test.title') }}
                  </ElDropdownItem>
                  <ElDropdownItem command="edit">
                    <PenLine class="size-3.5 mr-2" /> {{ t('common.edit') }}
                  </ElDropdownItem>
                  <ElDropdownItem command="delete">
                    <Trash2 class="size-3.5 mr-2 text-destructive" /> {{ t('common.delete') }}
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>

          <div class="mt-4 pt-3 border-t flex items-center gap-3 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1">
              <Cpu class="size-3" />
              {{ kb.embedding_model_config.model }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Layers class="size-3" />
              {{ kb.embedding_model_config.dimensions }}d
            </span>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-24 text-center">
        <div class="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Database class="size-6 text-muted-foreground" />
        </div>
        <p class="text-sm text-muted-foreground">{{ t('knowledge.empty') }}</p>
        <ElButton type="primary" class="mt-4" @click="showCreateDialog = true">
          <Plus class="size-4 mr-1.5" /> {{ t('knowledge.create') }}
        </ElButton>
      </div>
    </div>

      <CreateKnowledgeBaseDialog
        :open="showCreateDialog"
        @update:open="showCreateDialog = $event"
        :on-created="refetch"
      />

      <KnowledgeSearchDrawer
        :open="searchOpen"
        :knowledge-base-id="searchKbId"
        :knowledge-base-name="searchKbName"
        @update:open="searchOpen = $event"
      />

      <ElDialog
        :model-value="editDialogOpen"
        :width="480"
        @update:model-value="editDialogOpen = $event"
        top="5vh"
      >
        <template #header>
          <h3 class="text-lg font-semibold">{{ t('knowledge.editTitle') }}</h3>
        </template>
        <ElForm label-position="top">
          <ElFormItem :label="t('knowledge.name')" required>
            <ElInput v-model="editForm.name" />
          </ElFormItem>
          <ElFormItem :label="t('knowledge.description')">
            <ElInput v-model="editForm.description" type="textarea" :rows="2" />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="editDialogOpen = false">{{ t('common.cancel') }}</ElButton>
          <ElButton type="primary" :loading="editLoading" @click="handleEditKb">{{ t('common.save') }}</ElButton>
        </template>
      </ElDialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Trash2, Ellipsis, Search, Database, Cpu, Layers, PenLine } from 'lucide-vue-next';
import { useKnowledgeBases } from '@/composables/useKnowledgeBases';
import { knowledgeBaseApi } from '@/api';
import type { KnowledgeBaseView } from '@/api';
import KnowledgeSearchDrawer from '@/components/drawer/KnowledgeSearchDrawer.vue';
import CreateKnowledgeBaseDialog from '@/components/dialog/CreateKnowledgeBaseDialog.vue';
import { useTranslation } from '@/i18n/useI18n';

const { t } = useTranslation();
const { knowledgeBases, refetch } = useKnowledgeBases();

const showCreateDialog = ref(false);
const searchOpen = ref(false);
const searchKbId = ref('');
const searchKbName = ref('');

const editDialogOpen = ref(false);
const editLoading = ref(false);
const editKbId = ref('');
const editForm = reactive({ name: '', description: '' });

function handleSearch(kb: KnowledgeBaseView) {
  searchKbId.value = kb.id;
  searchKbName.value = kb.name;
  searchOpen.value = true;
}

function handleEditOpen(kb: KnowledgeBaseView) {
  editKbId.value = kb.id;
  editForm.name = kb.name;
  editForm.description = kb.description || '';
  editDialogOpen.value = true;
}

async function handleEditKb() {
  if (!editForm.name.trim()) return;
  editLoading.value = true;
  try {
    await knowledgeBaseApi.update(editKbId.value, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
    });
    ElMessage.success(t('knowledge.updateSuccess'));
    editDialogOpen.value = false;
    refetch();
  } catch {
    ElMessage.error(t('knowledge.updateError'));
  } finally {
    editLoading.value = false;
  }
}

async function handleAction(cmd: string, kb: any) {
  if (cmd === 'search') {
    handleSearch(kb);
  }
  if (cmd === 'edit') {
    handleEditOpen(kb);
  }
  if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm(t('knowledge.deleteConfirm'), t('common.confirm'), { type: 'warning' });
      await knowledgeBaseApi.delete(kb.id);
      ElMessage.success(t('knowledge.deleteSuccess'));
      refetch();
    } catch {
      // cancelled
    }
  }
}
</script>
