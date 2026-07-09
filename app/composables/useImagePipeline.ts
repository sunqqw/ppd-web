import { toRaw } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'
import { useSettingsStore } from '~/stores/settings'
import { useHistoryStore } from '~/stores/history'
import type { ImagePipelineParams } from '../../lib/types/grid'
import type { PaletteColor } from '../../lib/types/palette'
import type { ProcessImageResult } from '../../lib/image/pipeline'
import { applyMergeToGrid, imageDataToPlain } from '../../lib/image/pipeline'
import { calcGridSizePreservingAspectRatio } from '../../lib/image/aspect-ratio'

export interface ImportOptions {
  crop?: { x: number, y: number, w: number, h: number }
  targetSize?: { width: number, height: number }
  params?: Partial<ImagePipelineParams>
  /** 确认导入后是否写回全局转图参数 */
  syncParamsToSettings?: boolean
}

export function useImagePipeline() {
  const canvasStore = useCanvasStore()
  const paletteStore = usePaletteStore()
  const settingsStore = useSettingsStore()
  const historyStore = useHistoryStore()

  const processing = ref(false)
  const progress = ref('')
  const lastStats = ref<{
    colorCount: number
    targetMaxColors: number | null
    processingMs: number
  } | null>(null)

  let worker: Worker | null = null

  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(
        new URL('../../workers/image-worker.ts', import.meta.url),
        { type: 'module' },
      )
    }
    return worker
  }

  function loadImageToCanvas(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = reject
      img.src = url
    })
  }

  function imageToImageData(
    img: HTMLImageElement,
    crop?: { x: number, y: number, w: number, h: number },
  ): ImageData {
    const canvas = document.createElement('canvas')
    const sx = crop?.x ?? 0
    const sy = crop?.y ?? 0
    const sw = crop?.w ?? img.naturalWidth
    const sh = crop?.h ?? img.naturalHeight
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    return ctx.getImageData(0, 0, sw, sh)
  }

  function clonePaletteColors(colors: PaletteColor[]): PaletteColor[] {
    return toRaw(colors).map(c => ({ ...toRaw(c) }))
  }

  function cloneParams(params: ImagePipelineParams): ImagePipelineParams {
    return { ...toRaw(params) }
  }

  async function processImage(
    imageData: ImageData,
    params?: Partial<ImagePipelineParams>,
    targetSize?: { width: number, height: number },
  ): Promise<ProcessImageResult> {
    const mergedParams = cloneParams({ ...settingsStore.imageParams, ...params })
    const width = targetSize?.width ?? canvasStore.grid.width
    const height = targetSize?.height ?? canvasStore.grid.height
    const imagePlain = imageDataToPlain(imageData)

    processing.value = true
    progress.value = '正在处理图片...'

    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID()
      const w = getWorker()

      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return
        w.removeEventListener('message', handler)
        processing.value = false
        progress.value = ''

        if (e.data.type === 'error') {
          reject(new Error(e.data.message))
          return
        }

        resolve(e.data.payload)
      }

      w.addEventListener('message', handler)
      w.postMessage(
        {
          id,
          type: 'process-image',
          payload: {
            imageData: imagePlain,
            targetWidth: width,
            targetHeight: height,
            params: mergedParams,
            paletteColors: clonePaletteColors(paletteStore.activePalette.colors),
          },
        },
        [imagePlain.data.buffer],
      )
    })
  }

  function calcImportGridSize(
    imageWidth: number,
    imageHeight: number,
    refWidth = canvasStore.grid.width,
    refHeight = canvasStore.grid.height,
  ) {
    return calcGridSizePreservingAspectRatio(imageWidth, imageHeight, refWidth, refHeight)
  }

  async function importFromFile(file: File, options?: ImportOptions) {
    const crop = options?.crop
    const img = await loadImageToCanvas(file)
    const imageData = imageToImageData(img, crop)
    const srcW = crop?.w ?? img.naturalWidth
    const srcH = crop?.h ?? img.naturalHeight
    const { width, height } = options?.targetSize ?? calcImportGridSize(srcW, srcH)
    const result = await processImage(imageData, options?.params, { width, height })

    if (options?.syncParamsToSettings && options.params) {
      settingsStore.setImageParams(options.params)
    }

    historyStore.push(canvasStore.grid, '导入前')
    canvasStore.setGrid({
      width,
      height,
      cells: result.cells.map(c => ({ colorId: c.colorId })),
    })
    lastStats.value = result.stats
    return result
  }

  async function applyMerge() {
    const result = applyMergeToGrid(
      canvasStore.grid,
      clonePaletteColors(paletteStore.activePalette.colors),
      settingsStore.imageParams.mergeThreshold,
      settingsStore.imageParams.minRegionSize,
    )
    historyStore.push(canvasStore.grid, '合并前')
    canvasStore.setGrid(result)
  }

  return {
    processing,
    progress,
    lastStats,
    loadImageToCanvas,
    imageToImageData,
    processImage,
    importFromFile,
    calcImportGridSize,
    applyMerge,
  }
}
