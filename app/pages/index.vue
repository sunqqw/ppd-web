<script setup lang="ts">
import {
  NModal,
  NButton,
  NSpace,
  NSpin,
  useMessage,
  useDialog,
} from 'naive-ui'
import AppHeader from '~/components/layout/AppHeader.vue'
import ToolBar from '~/components/layout/ToolBar.vue'
import SidePanel from '~/components/layout/SidePanel.vue'
import CanvasEditor from '~/components/canvas/CanvasEditor.vue'
import ExportDrawingDialog from '~/components/export/ExportDrawingDialog.vue'
import ExportBomDialog from '~/components/export/ExportBomDialog.vue'
import { useImagePipeline } from '~/composables/useImagePipeline'
import { useDraft } from '~/composables/useDraft'
import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'

const { importFromFile, loadImageToCanvas, calcImportGridSize, processing, progress } = useImagePipeline()
const { load, restore, hasDraft, scheduleSave } = useDraft()
const canvasStore = useCanvasStore()
const paletteStore = usePaletteStore()
const message = useMessage()
const dialog = useDialog()

const { showEntrance, workspaceReady, checkEntrance, onEntranceComplete, playWorkspaceEntranceIfReady } = useEntrance()

const showExportDrawing = ref(false)
const showExportBom = ref(false)
const showImportPreview = ref(false)
const pendingFile = ref<File | null>(null)
const previewUrl = ref('')
const importGridSize = ref({ width: 50, height: 50 })
const importPreviewRef = ref<HTMLElement | null>(null)

const { fadeIn } = useGsapMotion()

watch(showImportPreview, (show) => {
  if (!show) return
  nextTick(() => {
    const img = importPreviewRef.value?.querySelector('img')
    fadeIn(img)
  })
})

async function handleImport(file: File) {
  pendingFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  try {
    const img = await loadImageToCanvas(file)
    importGridSize.value = calcImportGridSize(img.naturalWidth, img.naturalHeight)
  }
  catch {
    importGridSize.value = calcImportGridSize(1, 1)
  }
  showImportPreview.value = true
}

async function confirmImport() {
  if (!pendingFile.value) return
  showImportPreview.value = false
  try {
    const result = await importFromFile(pendingFile.value)
    message.success(`转换完成，用色 ${result.stats.colorCount} 种，耗时 ${result.stats.processingMs}ms`)
  }
  catch (err) {
    message.error(err instanceof Error ? err.message : '图片处理失败')
  }
  finally {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    pendingFile.value = null
  }
}

watch(
  () => canvasStore.gridRevision,
  () => scheduleSave(),
)

function initWorkspace() {
  if (hasDraft()) {
    const draft = load()
    if (draft) {
      dialog.info({
        title: '恢复草稿',
        content: `检测到 ${new Date(draft.savedAt).toLocaleString('zh-CN')} 的草稿，是否恢复？`,
        positiveText: '恢复',
        negativeText: '忽略',
        onPositiveClick: () => {
          restore(draft)
          message.success('草稿已恢复')
        },
      })
    }
  }

  if (!canvasStore.selectedColorId && paletteStore.activePalette.colors.length > 0) {
    const first = paletteStore.activePalette.colors[0]
    if (first) canvasStore.setSelectedColor(first.id)
  }
}

function handleEntranceComplete() {
  onEntranceComplete()
  initWorkspace()
}

onMounted(() => {
  checkEntrance()
  if (!showEntrance.value) {
    initWorkspace()
    playWorkspaceEntranceIfReady()
  }
})
</script>

<template>
  <EntranceScreen v-if="showEntrance" @complete="handleEntranceComplete" />

  <div class="workspace" :class="{ 'workspace--hidden': showEntrance && !workspaceReady }">
    <AppHeader
      @import-image="handleImport"
      @export-drawing="showExportDrawing = true"
      @export-bom="showExportBom = true"
    />
    <div class="workspace-main">
      <ToolBar />
      <CanvasEditor />
      <SidePanel />
    </div>

    <NModal v-model:show="showImportPreview" preset="card" title="确认导入图片" class="import-modal" style="width: 480px">
      <div v-if="previewUrl" ref="importPreviewRef" class="import-preview">
        <img :src="previewUrl" alt="预览">
      </div>
      <div class="import-meta">
        <span class="import-meta-tag">{{ importGridSize.width }}×{{ importGridSize.height }}</span>
        <span class="import-meta-text">{{ paletteStore.activePalette.name }}</span>
      </div>
      <p class="import-hint">
        将按原图宽高比生成图纸，所有处理均在本地完成
      </p>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showImportPreview = false">
            取消
          </NButton>
          <NButton type="primary" @click="confirmImport">
            生成图纸
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal :show="processing" :mask-closable="false" :close-on-esc="false">
      <NSpin size="large">
        <template #description>
          {{ progress || '正在处理...' }}
        </template>
      </NSpin>
    </NModal>

    <ExportDrawingDialog v-model:show="showExportDrawing" />
    <ExportBomDialog v-model:show="showExportBom" />
  </div>
</template>

<style scoped>
.workspace--hidden {
  visibility: hidden;
  pointer-events: none;
}

.import-preview {
  text-align: center;
  max-height: 300px;
  overflow: hidden;
  border-radius: var(--ws-radius-sm);
  background: var(--ws-surface-raised);
  border: 1px solid var(--ws-border-subtle);
}

.import-preview img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.import-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.import-meta-tag {
  display: inline-flex;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ws-primary);
  background: var(--ws-primary-soft);
  border-radius: 20px;
}

.import-meta-text {
  font-size: 13px;
  color: var(--ws-text-secondary);
}

.import-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--ws-text-muted);
}
</style>
