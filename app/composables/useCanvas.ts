import { useCanvasStore } from '~/stores/canvas'
import { useHistoryStore } from '~/stores/history'
import { useSettingsStore } from '~/stores/settings'

export function useCanvas() {
  const canvasStore = useCanvasStore()
  const historyStore = useHistoryStore()
  const settingsStore = useSettingsStore()

  function onZoom(e: WheelEvent, canvasEl: HTMLElement) {
    if (settingsStore.canvasFixed) return
    e.preventDefault()

    const { transform } = canvasStore
    const oldScale = transform.scale
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.2, Math.min(5, oldScale * delta))
    if (newScale === oldScale) return

    const rect = canvasEl.getBoundingClientRect()
    const focusX = e.clientX - rect.left
    const focusY = e.clientY - rect.top

    const oldCellSize = transform.cellPixelSize * oldScale
    const contentX = (focusX - transform.offsetX) / oldCellSize
    const contentY = (focusY - transform.offsetY) / oldCellSize

    const newCellSize = transform.cellPixelSize * newScale
    canvasStore.setTransform({
      scale: newScale,
      offsetX: focusX - contentX * newCellSize,
      offsetY: focusY - contentY * newCellSize,
    })
  }

  function onPanStart(e: PointerEvent) {
    if (settingsStore.canvasFixed) return null
    if (e.button === 1 || e.button === 2 || e.altKey) {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      return { startX: e.clientX, startY: e.clientY, offsetX: canvasStore.transform.offsetX, offsetY: canvasStore.transform.offsetY }
    }
    return null
  }

  function onPanMove(e: PointerEvent, panState: { startX: number, startY: number, offsetX: number, offsetY: number } | null) {
    if (!panState) return
    canvasStore.setTransform({
      offsetX: panState.offsetX + (e.clientX - panState.startX),
      offsetY: panState.offsetY + (e.clientY - panState.startY),
    })
  }

  function undo() {
    const prev = historyStore.undo(canvasStore.grid)
    if (prev) canvasStore.setGrid(prev)
  }

  function redo() {
    const next = historyStore.redo(canvasStore.grid)
    if (next) canvasStore.setGrid(next)
  }

  function fitToView(containerW: number, containerH: number) {
    const { width, height } = canvasStore.grid
    const cellSize = canvasStore.transform.cellPixelSize
    const gridW = width * cellSize
    const gridH = height * cellSize
    const scale = Math.min((containerW - 40) / gridW, (containerH - 40) / gridH, 2)
    canvasStore.setTransform({
      scale: Math.max(0.3, scale),
      offsetX: (containerW - gridW * scale) / 2,
      offsetY: (containerH - gridH * scale) / 2,
    })
  }

  /** 固定画布：保持当前缩放比，仅居中偏移 */
  function centerFixedView(containerW: number, containerH: number) {
    const { width, height } = canvasStore.grid
    const { scale, cellPixelSize } = canvasStore.transform
    const gridW = width * cellPixelSize * scale
    const gridH = height * cellPixelSize * scale
    canvasStore.setTransform({
      offsetX: (containerW - gridW) / 2,
      offsetY: (containerH - gridH) / 2,
    })
  }

  return { onZoom, onPanStart, onPanMove, undo, redo, fitToView, centerFixedView }
}
