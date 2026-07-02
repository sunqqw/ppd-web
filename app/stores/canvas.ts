import { defineStore } from 'pinia'
import {
  type GridState,
  type ViewTransform,
  createEmptyGrid,
  cloneGrid,
} from '../../lib/types/grid'

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
  }),

  getters: {
    totalBeads: (state) => {
      return state.grid.cells.filter(c => c.colorId !== null).length
    },
  },

  actions: {
    setGrid(grid: GridState) {
      this.grid = grid
      this.gridRevision++
    },

    replaceGrid(grid: GridState) {
      this.grid = cloneGrid(grid)
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
      this.gridRevision++
    },

    setCell(x: number, y: number, colorId: string | null) {
      const idx = y * this.grid.width + x
      if (idx >= 0 && idx < this.grid.cells.length) {
        this.grid.cells[idx].colorId = colorId
      }
    },

    clearGrid() {
      this.grid = createEmptyGrid(this.grid.width, this.grid.height)
      this.gridRevision++
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
