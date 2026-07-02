import type { PatternRenderer } from '../../lib/canvas/pattern-renderer'

export interface CellChange {
  x: number
  y: number
  colorId: string | null
}

type CellChangeCallback = (cells: CellChange[]) => void
type DrawEndCallback = () => void

const onCellChange = ref<CellChangeCallback | null>(null)
const onDrawEnd = ref<DrawEndCallback | null>(null)
const patternRenderer = shallowRef<PatternRenderer | null>(null)

export function useCanvasRenderer() {
  function registerRenderer(renderer: PatternRenderer) {
    patternRenderer.value = renderer
  }

  function registerCellChange(cb: CellChangeCallback) {
    onCellChange.value = cb
  }

  function registerDrawEnd(cb: DrawEndCallback) {
    onDrawEnd.value = cb
  }

  function notifyCellChange(cells: CellChange[]) {
    onCellChange.value?.(cells)
  }

  function notifyDrawEnd() {
    onDrawEnd.value?.()
  }

  return {
    patternRenderer,
    registerRenderer,
    registerCellChange,
    registerDrawEnd,
    notifyCellChange,
    notifyDrawEnd,
  }
}
