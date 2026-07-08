<script setup lang="ts">
import {
  NModal,
  NButton,
  NSpace,
  NInputNumber,
  NRadioGroup,
  NRadio,
  NSlider,
  NSwitch,
  NText,
  NTag,
} from 'naive-ui'
import type { ImagePipelineParams } from '../../../lib/types/grid'
import { DEFAULT_IMAGE_PARAMS } from '../../../lib/types/grid'
import { usePaletteStore } from '~/stores/palette'
import { useSettingsStore } from '~/stores/settings'
import { useImagePipeline } from '~/composables/useImagePipeline'

export interface ImportConfirmPayload {
  targetSize: { width: number, height: number }
  params: ImagePipelineParams
}

const show = defineModel<boolean>('show', { default: false })
const file = defineModel<File | null>('file', { default: null })

const emit = defineEmits<{
  confirm: [payload: ImportConfirmPayload]
}>()

const paletteStore = usePaletteStore()
const settingsStore = useSettingsStore()
const { loadImageToCanvas, calcImportGridSize } = useImagePipeline()

type SizePreset = 'auto' | '30' | '50' | '100' | 'custom'

const previewUrl = ref('')
const previewRef = ref<HTMLElement | null>(null)
const imageNaturalSize = ref({ width: 0, height: 0 })
const sizePreset = ref<SizePreset>('auto')
const customRefWidth = ref(50)
const customRefHeight = ref(50)
const localParams = ref<ImagePipelineParams>({ ...DEFAULT_IMAGE_PARAMS })
const loadingPreview = ref(false)

const { fadeIn } = useGsapMotion()

const gridSize = computed(() => {
  const { width, height } = imageNaturalSize.value
  if (width <= 0 || height <= 0) {
    return { width: 50, height: 50 }
  }

  switch (sizePreset.value) {
    case '30':
      return calcImportGridSize(width, height, 30, 30)
    case '50':
      return calcImportGridSize(width, height, 50, 50)
    case '100':
      return calcImportGridSize(width, height, 100, 100)
    case 'custom':
      return calcImportGridSize(width, height, customRefWidth.value, customRefHeight.value)
    default:
      return calcImportGridSize(width, height)
  }
})

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

async function loadPreview(target: File) {
  loadingPreview.value = true
  revokePreview()
  previewUrl.value = URL.createObjectURL(target)
  try {
    const img = await loadImageToCanvas(target)
    imageNaturalSize.value = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
  }
  catch {
    imageNaturalSize.value = { width: 0, height: 0 }
  }
  finally {
    loadingPreview.value = false
  }
}

function resetForm() {
  sizePreset.value = 'auto'
  customRefWidth.value = 50
  customRefHeight.value = 50
  localParams.value = { ...settingsStore.imageParams }
  imageNaturalSize.value = { width: 0, height: 0 }
}

function onConfirm() {
  emit('confirm', {
    targetSize: { ...gridSize.value },
    params: { ...localParams.value },
  })
  show.value = false
}

function onClose() {
  show.value = false
}

watch(show, (visible) => {
  if (visible && file.value) {
    resetForm()
    loadPreview(file.value)
    return
  }
  if (!visible) {
    revokePreview()
    file.value = null
  }
})

watch(file, (target) => {
  if (show.value && target) {
    resetForm()
    loadPreview(target)
  }
})

watch(previewUrl, () => {
  if (!previewUrl.value) return
  nextTick(() => {
    const img = previewRef.value?.querySelector('img')
    fadeIn(img)
  })
})

onUnmounted(revokePreview)
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    title="导入图片"
    class="import-image-dialog"
    style="width: 560px"
    @after-leave="revokePreview"
  >
    <div class="import-layout">
      <div v-if="previewUrl" ref="previewRef" class="import-preview">
        <img :src="previewUrl" alt="预览">
      </div>
      <div v-else class="import-preview import-preview--empty">
        <NText depth="3">
          {{ loadingPreview ? '加载预览中...' : '暂无预览' }}
        </NText>
      </div>

      <div class="import-options">
        <div class="option-block">
          <div class="option-label">
            原图尺寸
          </div>
          <NText depth="3" style="font-size: 12px">
            {{ imageNaturalSize.width }}×{{ imageNaturalSize.height }} px
          </NText>
        </div>

        <div class="option-block">
          <div class="option-label">
            目标图纸尺寸
          </div>
          <NRadioGroup v-model:value="sizePreset" size="small">
            <NSpace vertical :size="6">
              <NRadio value="auto">
                自动（按当前画布比例）
              </NRadio>
              <NRadio value="30">
                小图（约 30 格）
              </NRadio>
              <NRadio value="50">
                中图（约 50 格）
              </NRadio>
              <NRadio value="100">
                大图（约 100 格）
              </NRadio>
              <NRadio value="custom">
                自定义参考尺寸
              </NRadio>
            </NSpace>
          </NRadioGroup>
          <NSpace v-if="sizePreset === 'custom'" :size="8" style="margin-top: 8px">
            <NInputNumber
              v-model:value="customRefWidth"
              :min="10"
              :max="200"
              size="small"
              style="width: 100px"
            >
              <template #prefix>
                宽
              </template>
            </NInputNumber>
            <span>×</span>
            <NInputNumber
              v-model:value="customRefHeight"
              :min="10"
              :max="200"
              size="small"
              style="width: 100px"
            >
              <template #prefix>
                高
              </template>
            </NInputNumber>
          </NSpace>
          <div class="import-meta">
            <NTag :bordered="false" type="info" size="small">
              {{ gridSize.width }}×{{ gridSize.height }}
            </NTag>
            <NText depth="3" style="font-size: 12px">
              {{ paletteStore.activePalette.name }}
            </NText>
          </div>
        </div>

        <div class="option-block">
          <div class="option-label">
            精细度：{{ localParams.detail }}
          </div>
          <NSlider
            v-model:value="localParams.detail"
            :min="0"
            :max="100"
          />
        </div>

        <div class="option-block option-block--inline">
          <div class="option-label">
            背景智能移除
          </div>
          <NSwitch v-model:value="localParams.removeBackground" />
        </div>

        <div v-if="localParams.removeBackground" class="option-block">
          <div class="option-label">
            背景容差：{{ localParams.bgTolerance }}
          </div>
          <NSlider
            v-model:value="localParams.bgTolerance"
            :min="0"
            :max="100"
          />
        </div>

        <div class="option-block">
          <div class="option-label">
            杂色合并：{{ localParams.mergeThreshold }}
          </div>
          <NSlider
            v-model:value="localParams.mergeThreshold"
            :min="0"
            :max="100"
          />
        </div>

        <NText depth="3" class="import-hint">
          确认后将按以上参数在本地生成图纸，不会上传图片。
        </NText>
      </div>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="onClose">
          取消
        </NButton>
        <NButton type="primary" :disabled="!file || loadingPreview" @click="onConfirm">
          生成图纸
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.import-layout {
  display: flex;
  gap: 16px;
}

.import-preview {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 280px;
  overflow: hidden;
  border-radius: var(--ws-radius-sm);
  background: var(--ws-surface-raised);
  border: 1px solid var(--ws-border-subtle);
}

.import-preview--empty {
  min-height: 200px;
}

.import-preview img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}

.import-options {
  flex-shrink: 0;
  width: 240px;
  max-height: 420px;
  overflow-y: auto;
}

.option-block {
  margin-bottom: 14px;
}

.option-block--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.option-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ws-text-secondary);
  margin-bottom: 6px;
}

.option-block--inline .option-label {
  margin-bottom: 0;
}

.import-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.import-hint {
  display: block;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  :global(.import-image-dialog) {
    max-width: calc(100vw - 24px);
  }

  .import-layout {
    flex-direction: column;
  }

  .import-options {
    width: 100%;
    max-height: none;
  }

  .import-preview,
  .import-preview img {
    max-height: 220px;
  }
}
</style>
