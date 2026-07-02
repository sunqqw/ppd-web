import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'
import type { DrawingExportOptions, BomExportOptions } from '../../lib/types/export'
import { DEFAULT_DRAWING_EXPORT } from '../../lib/types/export'
import { exportDrawing, downloadBlob } from '../../lib/export/drawing-export'
import { exportBom, computeBom } from '../../lib/export/bom-export'

export function useExport() {
  const canvasStore = useCanvasStore()
  const paletteStore = usePaletteStore()

  async function exportDrawingImage(options: Partial<DrawingExportOptions> = {}) {
    const opts = { ...DEFAULT_DRAWING_EXPORT, ...options }
    const blob = await exportDrawing(canvasStore.grid, paletteStore.matcher, opts)
    const ext = opts.format === 'jpeg' ? 'jpg' : 'png'
    downloadBlob(blob, `拼豆图纸_${canvasStore.grid.width}x${canvasStore.grid.height}.${ext}`)
  }

  async function exportBomImage(options: Partial<BomExportOptions> = {}) {
    const opts: BomExportOptions = {
      title: '拼豆采购清单',
      sortBy: 'count',
      ...options,
    }
    const blob = await exportBom(canvasStore.grid, paletteStore.matcher, opts)
    downloadBlob(blob, `采购清单_${canvasStore.grid.width}x${canvasStore.grid.height}.png`)
  }

  async function generateDrawingPreview(options: Partial<DrawingExportOptions> = {}): Promise<string> {
    const opts = { ...DEFAULT_DRAWING_EXPORT, ...options }
    const blob = await exportDrawing(canvasStore.grid, paletteStore.matcher, opts)
    return URL.createObjectURL(blob)
  }

  function getBomItems() {
    return computeBom(canvasStore.grid, paletteStore.matcher)
  }

  return { exportDrawingImage, exportBomImage, generateDrawingPreview, getBomItems }
}
