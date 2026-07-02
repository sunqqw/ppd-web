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

const showExportDrawing = ref(false)
const showExportBom = ref(false)
const showImportPreview = ref(false)
const pendingFile = ref<File | null>(null)
const previewUrl = ref('')
const importGridSize = ref({ width: 50, height: 50 })

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

onMounted(() => {
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
    canvasStore.setSelectedColor(paletteStore.activePalette.colors[0].id)
  }
})
</script>

<template>
  <div class="workspace">
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

    <NModal v-model:show="showImportPreview" preset="card" title="确认导入图片" style="width: 480px">
      <div v-if="previewUrl" class="import-preview">
        <img :src="previewUrl" alt="预览">
      </div>
      <p style="font-size: 13px; color: #666; margin-top: 12px">
        将按原图宽高比生成 {{ importGridSize.width }}×{{ importGridSize.height }} 图纸（{{ paletteStore.activePalette.name }}）
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
.import-preview {
  text-align: center;
  max-height: 300px;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f5f5;
}

.import-preview img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}
</style>
