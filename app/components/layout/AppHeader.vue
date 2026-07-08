<script setup lang="ts">
import {
  NButton,
  NSpace,
  NUpload,
  useMessage,
  useDialog,
} from 'naive-ui'
import { useCanvasStore } from '~/stores/canvas'
import { useHistoryStore } from '~/stores/history'
import { useCanvas } from '~/composables/useCanvas'
import { useDraft } from '~/composables/useDraft'

const emit = defineEmits<{
  importImage: [file: File]
  exportDrawing: []
  exportBom: []
}>()

const canvasStore = useCanvasStore()
const historyStore = useHistoryStore()
const { undo, redo } = useCanvas()
const { clear: clearDraft } = useDraft()
const message = useMessage()
const dialog = useDialog()

function onNew() {
  dialog.warning({
    title: '新建图纸',
    content: '确定要新建图纸吗？当前内容将被清空。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      canvasStore.clearGrid()
      clearDraft()
      message.success('已新建空白图纸')
    },
  })
}

function onClear() {
  dialog.warning({
    title: '清空画布',
    content: '确定要清空画布吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      canvasStore.clearGrid()
      message.success('画布已清空')
    },
  })
}

function handleUpload({ file }: { file: { file: File | null } }) {
  if (file.file) emit('importImage', file.file)
  return false
}
</script>

<template>
  <header class="app-header">
    <div class="app-header-brand">
      <NuxtLink to="/" class="brand-link">
        <span class="brand-icon" aria-hidden="true">🧩</span>
        <span class="brand-text">
          <span class="brand-name">拼豆图纸生成器</span>
          <span class="brand-sub">本地智能转图</span>
        </span>
      </NuxtLink>
    </div>

    <div class="app-header-actions">
      <div class="action-group">
        <NButton size="small" quaternary @click="onNew">
          新建
        </NButton>
        <NUpload
          :show-file-list="false"
          accept="image/jpeg,image/png,image/gif,image/webp"
          @before-upload="handleUpload"
        >
          <NButton size="small" type="primary">
            导入图片
          </NButton>
        </NUpload>
      </div>

      <span class="action-divider" />

      <div class="action-group">
        <NButton size="small" quaternary :disabled="!historyStore.canUndo" @click="undo">
          撤销
        </NButton>
        <NButton size="small" quaternary :disabled="!historyStore.canRedo" @click="redo">
          重做
        </NButton>
        <NButton size="small" quaternary @click="onClear">
          清空
        </NButton>
      </div>

      <span class="action-divider" />

      <div class="action-group">
        <NButton size="small" type="primary" ghost @click="emit('exportDrawing')">
          导出图纸
        </NButton>
        <NButton size="small" type="success" ghost @click="emit('exportBom')">
          导出清单
        </NButton>
      </div>

      <span class="action-divider" />

      <NSpace align="center" :size="4">
        <NuxtLink to="/help">
          <NButton size="small" quaternary>
            帮助
          </NButton>
        </NuxtLink>
        <NuxtLink to="/palettes">
          <NButton size="small" quaternary>
            色号库
          </NButton>
        </NuxtLink>
      </NSpace>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--ws-header-h);
  padding: 0 16px;
  background: var(--ws-surface);
  border-bottom: 1px solid var(--ws-border);
  box-shadow: var(--ws-shadow-sm);
  flex-shrink: 0;
  z-index: 10;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ws-text);
}

.brand-link:hover .brand-name {
  color: var(--ws-primary);
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 20px;
  border-radius: var(--ws-radius-sm);
  background: linear-gradient(135deg, #e8f2fe, #f0e8ff);
  box-shadow: inset 0 0 0 1px rgba(32, 128, 240, 0.1);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  transition: color 0.15s;
}

.brand-sub {
  font-size: 11px;
  color: var(--ws-text-muted);
  font-weight: 400;
}

.app-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-divider {
  width: 1px;
  height: 22px;
  background: var(--ws-border);
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .brand-sub {
    display: none;
  }

  .action-divider:nth-of-type(2) {
    display: none;
  }
}

@media (max-width: 700px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    height: auto;
    padding: 10px 12px;
  }

  .app-header-brand,
  .brand-link {
    min-width: 0;
    width: 100%;
  }

  .brand-icon {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .brand-name {
    font-size: 14px;
  }

  .app-header-actions {
    width: 100%;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .action-group {
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  .app-header-actions {
    gap: 6px;
  }

  .action-divider {
    display: none;
  }
}
</style>
