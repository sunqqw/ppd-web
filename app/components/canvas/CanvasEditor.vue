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
const { onZoom, onPanStart, onPanMove, centerFixedView } = useCanvas()
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
  ctx.clearRect(0, 0, cw, ch)
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

function applyFixedView() {
  if (!settingsStore.canvasFixed) return
  const container = containerRef.value
  if (!container) return
  centerFixedView(container.clientWidth, container.clientHeight)
  schedulePatternDraw()
  scheduleGridDraw()
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

watch(
  () => [
    settingsStore.canvasFixed,
    canvasStore.grid.width,
    canvasStore.grid.height,
    canvasStore.transform.cellPixelSize,
  ],
  () => {
    applyFixedView()
  },
)

function handleWindowResize() {
  applyFixedView()
  schedulePatternDraw()
  scheduleGridDraw()
}

onMounted(() => {
  ensureRenderer()
  applyFixedView()
  schedulePatternDraw()
  scheduleGridDraw()
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  cancelAnimationFrame(gridRafId)
  window.removeEventListener('resize', handleWindowResize)
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

const zoomPercent = computed(() =>
  Math.round(canvasStore.transform.scale * 100),
)

const gridLabel = computed(() =>
  `${canvasStore.grid.width}×${canvasStore.grid.height}`,
)

const beadCount = computed(() => canvasStore.totalBeads)

const selectedColorLabel = computed(() =>
  canvasStore.selectedColorId ?? '—',
)
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-area"
    :class="{ panning: !!panState, 'canvas-fixed': settingsStore.canvasFixed }"
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

    <div class="canvas-statusbar">
      <div class="status-group">
        <span class="status-item">
          <span class="status-label">尺寸</span>
          <span class="status-value">{{ gridLabel }}</span>
        </span>
        <span class="status-dot" />
        <span class="status-item">
          <span class="status-label">缩放</span>
          <span class="status-value">{{ zoomPercent }}%</span>
        </span>
        <span class="status-dot" />
        <span class="status-item">
          <span class="status-label">豆子</span>
          <span class="status-value">{{ beadCount }}</span>
        </span>
      </div>
      <div class="status-group">
        <span class="status-item">
          <span class="status-label">当前色</span>
          <span
            class="status-color"
            :style="{ background: canvasStore.selectedColorId ? paletteStore.matcher.getHex(canvasStore.selectedColorId) : '#e2e6ed' }"
          />
          <span class="status-value">{{ selectedColorLabel }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-area {
  position: relative;
}

.canvas-area.canvas-fixed {
  cursor: default;
}

.canvas-area.canvas-fixed .canvas-layer {
  cursor: crosshair;
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

.canvas-statusbar {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid var(--ws-border);
  border-radius: var(--ws-radius-sm);
  box-shadow: var(--ws-shadow-md);
  pointer-events: none;
  font-size: 12px;
  z-index: 2;
}

.status-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-label {
  color: var(--ws-text-muted);
  font-size: 11px;
}

.status-value {
  color: var(--ws-text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.status-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--ws-border);
}

.status-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

@media (max-width: 700px) {
  .canvas-area {
    order: 1;
    min-height: 0;
  }

  .canvas-statusbar {
    left: 8px;
    right: 8px;
    bottom: 8px;
    flex-wrap: wrap;
    gap: 6px 10px;
    padding: 7px 10px;
    font-size: 11px;
  }

  .status-group {
    gap: 8px;
  }

  .status-label {
    display: none;
  }
}

@media (max-width: 480px) {
  .canvas-statusbar {
    justify-content: center;
  }

  .status-group:last-child {
    display: none;
  }
}
</style>
