<script setup lang="ts">
import {
  NModal,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NSpace,
  NButton,
  NSelect,
  NSpin,
} from 'naive-ui'
import type { DrawingExportOptions } from '../../../lib/types/export'
import { DEFAULT_DRAWING_EXPORT } from '../../../lib/types/export'
import { useExport } from '~/composables/useExport'
import { useCanvasStore } from '~/stores/canvas'

const show = defineModel<boolean>('show', { default: false })

const options = ref<DrawingExportOptions>({ ...DEFAULT_DRAWING_EXPORT })
const exporting = ref(false)
const previewUrl = ref('')
const previewLoading = ref(false)
const { exportDrawingImage, generateDrawingPreview } = useExport()
const canvasStore = useCanvasStore()

let previewTimer: ReturnType<typeof setTimeout> | null = null

const scaleOptions = [
  { label: '1× 标准', value: 1 },
  { label: '2× 推荐打印', value: 2 },
  { label: '4× 高清', value: 4 },
]

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

async function refreshPreview() {
  if (!show.value) return
  previewLoading.value = true
  try {
    const url = await generateDrawingPreview(options.value)
    revokePreview()
    previewUrl.value = url
  }
  finally {
    previewLoading.value = false
  }
}

function schedulePreview() {
  if (!show.value) return
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(refreshPreview, 300)
}

async function onExport() {
  exporting.value = true
  try {
    await exportDrawingImage(options.value)
    show.value = false
  }
  finally {
    exporting.value = false
  }
}

watch(show, (visible) => {
  if (visible) {
    schedulePreview()
  }
  else {
    if (previewTimer) clearTimeout(previewTimer)
    revokePreview()
  }
})

watch(options, schedulePreview, { deep: true })

watch(() => canvasStore.gridRevision, () => {
  if (show.value) schedulePreview()
})

onUnmounted(() => {
  if (previewTimer) clearTimeout(previewTimer)
  revokePreview()
})
</script>

<template>
  <NModal v-model:show="show" preset="card" title="导出图纸" style="width: 560px">
    <div class="export-layout">
      <div class="export-preview">
        <NSpin :show="previewLoading" size="small">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            alt="导出预览"
            class="preview-image"
          >
          <div v-else class="preview-placeholder">
            预览生成中...
          </div>
        </NSpin>
      </div>

      <NSpace vertical :size="12" class="export-options">
        <NCheckbox v-model:checked="options.showGrid">
          显示网格线
        </NCheckbox>
        <NCheckbox v-model:checked="options.showColorLabels">
          显示色号标注
        </NCheckbox>
        <NCheckbox v-model:checked="options.showSizeLabel">
          显示尺寸标注
        </NCheckbox>
        <NCheckbox v-model:checked="options.showLegend">
          显示色号图例
        </NCheckbox>

        <div>
          <div class="option-label">
            导出倍率
          </div>
          <NSelect
            v-model:value="options.scale"
            :options="scaleOptions"
            size="small"
          />
        </div>

        <div>
          <div class="option-label">
            格式
          </div>
          <NRadioGroup v-model:value="options.format" size="small">
            <NRadio value="png">
              PNG（推荐打印）
            </NRadio>
            <NRadio value="jpeg">
              JPG
            </NRadio>
          </NRadioGroup>
        </div>
      </NSpace>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="show = false">
          取消
        </NButton>
        <NButton type="primary" :loading="exporting" @click="onExport">
          下载
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.export-layout {
  display: flex;
  gap: 16px;
}

.export-preview {
  flex: 1;
  min-width: 0;
  max-height: 360px;
  overflow: auto;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
}

.preview-image {
  display: block;
  width: 100%;
  height: auto;
}

.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 13px;
  color: #999;
}

.export-options {
  flex-shrink: 0;
  width: 200px;
}

.option-label {
  font-size: 13px;
  margin-bottom: 6px;
  color: #666;
}
</style>
