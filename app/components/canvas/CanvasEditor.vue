<script setup lang="ts">
import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'
import { useSettingsStore } from '~/stores/settings'
import { useTools } from '~/composables/useTools'
import { useCanvas } from '~/composables/useCanvas'
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useDraft } from '~/composables/useDraft'
import { PatternRenderer } from '../../../lib/canvas/pattern-renderer'
import { drawGridOverlay, drawSelection } from '../../../lib/canvas/grid-overlay'
import { drawColorLabels } from '../../../lib/canvas/color-labels'

const canvasStore = useCanvasStore()
const paletteStore = usePaletteStore()
const settingsStore = useSettingsStore()
const { onPointerDown, onPointerMove, onPointerUp } = useTools()
const { onZoom, onPanStart, onPanMove } = useCanvas()
const { registerRenderer, registerCellChange, registerDrawEnd } = useCanvasRenderer()
const { scheduleSave } = useDraft()

const containerRef = ref<HTMLDivElement>()
const patternCanvasRef = ref<HTMLCanvasElement>()
const gridCanvasRef = ref<HTMLCanvasElement>()

let renderer: PatternRenderer | null = null
let panState: ReturnType<typeof onPanStart> = null
let rafId = 0
let gridRafId = 0

function getHex(colorId: string) {
  return paletteStore.matcher.getHex(colorId)
}

function ensureRenderer() {
  const { width, height } = canvasStore.grid
  if (!renderer) {
    renderer = new PatternRenderer(width, height, getHex)
    registerRenderer(renderer)
    renderer.rebuildFromGrid(canvasStore.grid)
    return
  }
  if (renderer.resize(width, height, getHex)) {
    renderer.rebuildFromGrid(canvasStore.grid)
  }
}

function drawPattern() {
  const canvas = patternCanvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  ensureRenderer()
  if (!renderer) return

  const { transform } = canvasStore
  const cellSize = transform.cellPixelSize * transform.scale
  const cw = container.clientWidth
  const ch = container.clientHeight

  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw
    canvas.height = ch
  }

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#e8eaed'
  ctx.fillRect(0, 0, cw, ch)
  renderer.drawTo(ctx, transform.offsetX, transform.offsetY, cellSize)

  if (settingsStore.showColorLabels) {
    drawColorLabels(
      ctx,
      canvasStore.grid,
      getHex,
      transform.offsetX,
      transform.offsetY,
      cellSize,
      1,
      'cell',
    )
  }

  if (canvasStore.selection) {
    drawSelection(ctx, canvasStore.selection, transform.offsetX, transform.offsetY, cellSize)
  }
}

function drawGrid() {
  if (!settingsStore.showGrid) {
    const gridCanvas = gridCanvasRef.value
    if (gridCanvas) {
      const ctx = gridCanvas.getContext('2d')!
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height)
    }
    return
  }

  const canvas = gridCanvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const { grid, transform } = canvasStore
  const cellSize = transform.cellPixelSize * transform.scale
  const cw = container.clientWidth
  const ch = container.clientHeight

  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw
    canvas.height = ch
  }

  drawGridOverlay(
    canvas.getContext('2d')!,
    grid.width,
    grid.height,
    transform.offsetX,
    transform.offsetY,
    cellSize,
    cw,
    ch,
  )
}

function schedulePatternDraw() {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(drawPattern)
}

function scheduleGridDraw() {
  cancelAnimationFrame(gridRafId)
  gridRafId = requestAnimationFrame(drawGrid)
}

registerCellChange((cells) => {
  ensureRenderer()
  renderer?.updateCells(cells)
  schedulePatternDraw()
})

registerDrawEnd(() => {
  scheduleSave()
})

watch(
  () => [canvasStore.grid.width, canvasStore.grid.height, canvasStore.gridRevision, paletteStore.activePaletteKey],
  () => {
    ensureRenderer()
    renderer?.rebuildFromGrid(canvasStore.grid)
    schedulePatternDraw()
  },
)

watch(
  () => [
    canvasStore.transform.scale,
    canvasStore.transform.offsetX,
    canvasStore.transform.offsetY,
    canvasStore.transform.cellPixelSize,
    canvasStore.selection,
    settingsStore.showGrid,
    settingsStore.showColorLabels,
    canvasStore.gridRevision,
  ],
  () => {
    schedulePatternDraw()
    scheduleGridDraw()
  },
)

onMounted(() => {
  ensureRenderer()
  schedulePatternDraw()
  scheduleGridDraw()
  window.addEventListener('resize', () => {
    schedulePatternDraw()
    scheduleGridDraw()
  })
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  cancelAnimationFrame(gridRafId)
})

function handlePointerDown(e: PointerEvent) {
  if (e.button === 1 || e.button === 2 || e.altKey) {
    panState = onPanStart(e)
    return
  }
  canvasStore.setDrawing(true)
  if (patternCanvasRef.value) onPointerDown(e, patternCanvasRef.value)
}

function handlePointerMove(e: PointerEvent) {
  if (panState) {
    onPanMove(e, panState)
    schedulePatternDraw()
    scheduleGridDraw()
    return
  }
  if (patternCanvasRef.value) onPointerMove(e, patternCanvasRef.value)
}

function handlePointerUp() {
  panState = null
  onPointerUp()
  canvasStore.setDrawing(false)
  schedulePatternDraw()
}
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-area"
    :class="{ panning: !!panState }"
    @contextmenu.prevent
  >
    <canvas
      ref="patternCanvasRef"
      class="canvas-layer"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerUp"
      @wheel.prevent="(e) => { onZoom(e, containerRef!); schedulePatternDraw(); scheduleGridDraw() }"
    />
    <canvas
      ref="gridCanvasRef"
      class="canvas-layer grid-layer"
    />
  </div>
</template>

<style scoped>
.canvas-area {
  position: relative;
}

.canvas-layer {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.grid-layer {
  pointer-events: none;
}
</style>
