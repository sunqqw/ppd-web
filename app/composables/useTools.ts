import { useCanvasStore } from '~/stores/canvas'
import { useHistoryStore } from '~/stores/history'
import { useSettingsStore } from '~/stores/settings'
import { usePaletteStore } from '~/stores/palette'
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { screenToGrid } from '../../lib/grid/grid-utils'
import { floodFillGrid } from '../../lib/grid/grid-ops'
import { bresenhamLine, brushStamp } from '../../lib/grid/line-draw'
import { gridIndex, isInGrid } from '../../lib/types/grid'

export function useTools() {
  const canvasStore = useCanvasStore()
  const historyStore = useHistoryStore()
  const settingsStore = useSettingsStore()
  const paletteStore = usePaletteStore()
  const { notifyCellChange, notifyDrawEnd } = useCanvasRenderer()

  let isDrawing = false
  let lastPos: { x: number, y: number } | null = null
  let selectStart: { x: number, y: number } | null = null
  let strokeCells: { x: number, y: number, colorId: string | null }[] = []

  function saveHistory(label: string) {
    historyStore.push(canvasStore.grid, label)
  }

  function applyCells(cells: { x: number, y: number, colorId: string | null }[]) {
    const changed: { x: number, y: number, colorId: string | null }[] = []
    const grid = canvasStore.grid

    for (const { x, y, colorId } of cells) {
      if (!isInGrid(x, y, grid)) continue
      const idx = gridIndex(x, y, grid.width)
      if (grid.cells[idx].colorId === colorId) continue
      grid.cells[idx].colorId = colorId
      changed.push({ x, y, colorId })
    }

    if (changed.length > 0) {
      notifyCellChange(changed)
    }
    return changed
  }

  function paintAt(x: number, y: number) {
    const colorId = settingsStore.tool === 'eraser' ? null : canvasStore.selectedColorId
    const size = settingsStore.brushSize
    const points = brushStamp(x, y, size)
    const cells = points.map(p => ({ ...p, colorId }))
    applyCells(cells)
    strokeCells.push(...cells)
  }

  function paintLine(x0: number, y0: number, x1: number, y1: number) {
    const colorId = settingsStore.tool === 'eraser' ? null : canvasStore.selectedColorId
    const size = settingsStore.brushSize
    const line = bresenhamLine(x0, y0, x1, y1)
    const cells: { x: number, y: number, colorId: string | null }[] = []

    for (const p of line) {
      for (const s of brushStamp(p.x, p.y, size)) {
        cells.push({ ...s, colorId })
      }
    }
    applyCells(cells)
    strokeCells.push(...cells)
  }

  function onPointerDown(e: PointerEvent, canvasEl: HTMLCanvasElement) {
    const rect = canvasEl.getBoundingClientRect()
    const pos = screenToGrid(
      e.clientX, e.clientY,
      canvasStore.transform, rect,
      canvasStore.grid.width, canvasStore.grid.height,
    )
    if (!pos) return

    strokeCells = []

    if (settingsStore.tool === 'fill') {
      saveHistory('填充')
      const target = canvasStore.grid.cells[gridIndex(pos.x, pos.y, canvasStore.grid.width)].colorId
      const changed = floodFillGrid(canvasStore.grid, pos.x, pos.y, target, canvasStore.selectedColorId)
      notifyCellChange(changed.map(p => ({ ...p, colorId: canvasStore.selectedColorId })))
      canvasStore.bumpRevision()
      notifyDrawEnd()
      return
    }

    if (settingsStore.tool === 'picker') {
      const cell = canvasStore.grid.cells[gridIndex(pos.x, pos.y, canvasStore.grid.width)]
      if (cell.colorId) canvasStore.setSelectedColor(cell.colorId)
      return
    }

    if (settingsStore.tool === 'select') {
      selectStart = pos
      canvasStore.setSelection({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
      return
    }

    isDrawing = true
    saveHistory(settingsStore.tool === 'eraser' ? '擦除' : '绘制')
    paintAt(pos.x, pos.y)
    lastPos = pos
  }

  function onPointerMove(e: PointerEvent, canvasEl: HTMLCanvasElement) {
    const rect = canvasEl.getBoundingClientRect()
    const pos = screenToGrid(
      e.clientX, e.clientY,
      canvasStore.transform, rect,
      canvasStore.grid.width, canvasStore.grid.height,
    )

    if (settingsStore.tool === 'select' && selectStart && pos) {
      canvasStore.setSelection({
        x1: Math.min(selectStart.x, pos.x),
        y1: Math.min(selectStart.y, pos.y),
        x2: Math.max(selectStart.x, pos.x),
        y2: Math.max(selectStart.y, pos.y),
      })
      return
    }

    if (!isDrawing || !pos) return
    if (lastPos && lastPos.x === pos.x && lastPos.y === pos.y) return

    if (lastPos) {
      paintLine(lastPos.x, lastPos.y, pos.x, pos.y)
    }
    else {
      paintAt(pos.x, pos.y)
    }
    lastPos = pos
  }

  function onPointerUp() {
    if (settingsStore.tool === 'select' && canvasStore.selection && canvasStore.selectedColorId) {
      const { x1, y1, x2, y2 } = canvasStore.selection
      saveHistory('批量改色')
      const cells: { x: number, y: number, colorId: string | null }[] = []
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          cells.push({ x, y, colorId: canvasStore.selectedColorId })
        }
      }
      applyCells(cells)
    }

    if (isDrawing && strokeCells.length > 0) {
      notifyDrawEnd()
    }

    isDrawing = false
    lastPos = null
    selectStart = null
    strokeCells = []
    canvasStore.setSelection(null)
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}
