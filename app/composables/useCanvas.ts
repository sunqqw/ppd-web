import { useCanvasStore } from '~/stores/canvas'
import { useHistoryStore } from '~/stores/history'

export function useCanvas() {
  const canvasStore = useCanvasStore()
  const historyStore = useHistoryStore()

  function onZoom(e: WheelEvent, canvasEl: HTMLElement) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.2, Math.min(5, canvasStore.transform.scale * delta))
    canvasStore.setTransform({ scale: newScale })
  }

  function onPanStart(e: PointerEvent) {
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

  return { onZoom, onPanStart, onPanMove, undo, redo, fitToView }
}
