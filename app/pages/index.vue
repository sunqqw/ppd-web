<script setup lang="ts">
import {
  NModal,
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
import ImportImageDialog, { type ImportConfirmPayload } from '~/components/import/ImportImageDialog.vue'
import { useImagePipeline } from '~/composables/useImagePipeline'
import { useDraft } from '~/composables/useDraft'
import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'

const { importFromFile, processing, progress } = useImagePipeline()
const { load, restore, hasDraft, scheduleSave } = useDraft()
const canvasStore = useCanvasStore()
const paletteStore = usePaletteStore()
const message = useMessage()
const dialog = useDialog()

const { showEntrance, workspaceReady, checkEntrance, onEntranceComplete, playWorkspaceEntranceIfReady } = useEntrance()

const showExportDrawing = ref(false)
const showExportBom = ref(false)
const showImportDialog = ref(false)
const pendingFile = ref<File | null>(null)

function handleImport(file: File) {
  pendingFile.value = file
  showImportDialog.value = true
}

async function confirmImport(payload: ImportConfirmPayload) {
  if (!pendingFile.value) return

  const file = pendingFile.value
  pendingFile.value = null

  try {
    const result = await importFromFile(file, {
      targetSize: payload.targetSize,
      params: payload.params,
      syncParamsToSettings: true,
    })
    message.success(`转换完成，用色 ${result.stats.colorCount} 种，耗时 ${result.stats.processingMs}ms`)
  }
  catch (err) {
    message.error(err instanceof Error ? err.message : '图片处理失败')
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

    <ImportImageDialog
      v-model:show="showImportDialog"
      v-model:file="pendingFile"
      @confirm="confirmImport"
    />

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
</style>
