import { defineStore } from 'pinia'
import {
  type GridState,
  type ViewTransform,
  createEmptyGrid,
  cloneGrid,
} from '../../lib/types/grid'

interface CellChange {
  x: number
  y: number
  colorId: string | null
}

function countBeads(grid: GridState) {
  let count = 0
  for (const cell of grid.cells) {
    if (cell.colorId !== null) count++
  }
  return count
}

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    grid: createEmptyGrid(50, 50) as GridState,
    transform: {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      cellPixelSize: 16,
    } as ViewTransform,
    selectedColorId: null as string | null,
    selection: null as { x1: number, y1: number, x2: number, y2: number } | null,
    gridRevision: 0,
    isDrawing: false,
    totalBeads: 0,
  }),

  actions: {
    setGrid(grid: GridState) {
      this.grid = grid
      this.totalBeads = countBeads(grid)
      this.gridRevision++
    },

    replaceGrid(grid: GridState) {
      this.grid = cloneGrid(grid)
      this.totalBeads = countBeads(this.grid)
      this.gridRevision++
    },

    resizeGrid(width: number, height: number) {
      const newGrid = createEmptyGrid(width, height)
      const minW = Math.min(width, this.grid.width)
      const minH = Math.min(height, this.grid.height)
      for (let y = 0; y < minH; y++) {
        for (let x = 0; x < minW; x++) {
          newGrid.cells[y * width + x] = { ...this.grid.cells[y * this.grid.width + x] }
        }
      }
      this.grid = newGrid
      this.totalBeads = countBeads(newGrid)
      this.gridRevision++
    },

    setCell(x: number, y: number, colorId: string | null) {
      const idx = y * this.grid.width + x
      if (idx >= 0 && idx < this.grid.cells.length) {
        const previous = this.grid.cells[idx].colorId
        if (previous === colorId) return
        this.grid.cells[idx].colorId = colorId
        this.updateBeadDelta(previous, colorId)
      }
    },

    applyCellChanges(cells: CellChange[]) {
      const changed: CellChange[] = []
      const width = this.grid.width

      for (const { x, y, colorId } of cells) {
        if (x < 0 || y < 0 || x >= width || y >= this.grid.height) continue
        const idx = y * width + x
        const previous = this.grid.cells[idx].colorId
        if (previous === colorId) continue
        this.grid.cells[idx].colorId = colorId
        this.updateBeadDelta(previous, colorId)
        changed.push({ x, y, colorId })
      }

      return changed
    },

    clearGrid() {
      this.grid = createEmptyGrid(this.grid.width, this.grid.height)
      this.totalBeads = 0
      this.gridRevision++
    },

    syncTotalBeads() {
      this.totalBeads = countBeads(this.grid)
    },

    updateBeadDelta(previous: string | null, next: string | null) {
      if (previous === null && next !== null) this.totalBeads++
      else if (previous !== null && next === null) this.totalBeads--
    },

    setTransform(partial: Partial<ViewTransform>) {
      Object.assign(this.transform, partial)
    },

    setSelectedColor(colorId: string | null) {
      this.selectedColorId = colorId
    },

    setSelection(sel: typeof this.selection) {
      this.selection = sel
    },

    bumpRevision() {
      this.gridRevision++
    },

    setDrawing(drawing: boolean) {
      this.isDrawing = drawing
    },
  },
})
