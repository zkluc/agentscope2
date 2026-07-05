<template>
  <div class="flex-1 overflow-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">{{ t('knowledge.title') }}</h1>
      <ElButton type="primary" @click="showCreateDialog = true">
        <Plus class="size-4 mr-1" /> {{ t('knowledge.create') }}
      </ElButton>
    </div>

    <!-- KB List -->
    <div v-if="knowledgeBases.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="kb in knowledgeBases"
        :key="kb.id"
        class="rounded-lg border p-4 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-medium">{{ kb.name }}</h3>
            <p v-if="kb.description" class="text-sm text-muted-foreground mt-1">{{ kb.description }}</p>
          </div>
          <div class="flex items-center gap-1">
            <ElTooltip :content="t('knowledge.test.title')">
              <ElButton size="small" text @click="handleSearch(kb)">
                <Search class="size-4" />
              </ElButton>
            </ElTooltip>
            <ElDropdown trigger="click" @command="(cmd: string) => handleAction(cmd, kb)">
              <ElButton size="small" text>
                <Ellipsis class="size-4" />
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="delete">
                    <Trash2 class="size-3 mr-1" /> {{ t('common.delete') }}
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
        </div>
        <div class="mt-3 text-xs text-muted-foreground">
          <span>{{ t('knowledge.model') }}: {{ kb.embedding_model_config.model }}</span>
          <span class="ml-3">{{ t('knowledge.dimensions') }}: {{ kb.embedding_model_config.dimensions }}</span>
        </div>
      </div>
    </div>

    <ElEmpty v-else :description="t('knowledge.empty')" />

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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElEmpty, ElMessage, ElMessageBox, ElTooltip } from 'element-plus';
import { Plus, Trash2, Ellipsis, Search } from 'lucide-vue-next';
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

function handleSearch(kb: KnowledgeBaseView) {
  searchKbId.value = kb.id;
  searchKbName.value = kb.name;
  searchOpen.value = true;
}

async function handleAction(cmd: string, kb: any) {
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
