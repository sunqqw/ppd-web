<script setup lang="ts">
import {
  NButton,
  NSpace,
  NUpload,
  NIcon,
  useMessage,
  useDialog,
} from 'naive-ui'
import { useCanvasStore } from '~/stores/canvas'
import { useHistoryStore } from '~/stores/history'
import { useCanvas } from '~/composables/useCanvas'
import { useExport } from '~/composables/useExport'
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
        🧩 拼豆图纸生成器
      </NuxtLink>
    </div>
    <NSpace align="center" :size="8">
      <NButton size="small" @click="onNew">
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
      <NButton size="small" :disabled="!historyStore.canUndo" @click="undo">
        撤销
      </NButton>
      <NButton size="small" :disabled="!historyStore.canRedo" @click="redo">
        重做
      </NButton>
      <NButton size="small" @click="onClear">
        清空
      </NButton>
      <NButton size="small" type="info" @click="emit('exportDrawing')">
        导出图纸
      </NButton>
      <NButton size="small" type="success" @click="emit('exportBom')">
        导出采购清单
      </NButton>
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
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.brand-link {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.brand-link:hover {
  color: #2080f0;
}
</style>
