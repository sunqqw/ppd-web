import { defineStore } from 'pinia'
import type { GridState } from '../../lib/types/grid'
import { cloneGrid } from '../../lib/types/grid'

interface HistoryEntry {
  grid: GridState
  label: string
}

const MAX_STACK = 50

export const useHistoryStore = defineStore('history', {
  state: () => ({
    undoStack: [] as HistoryEntry[],
    redoStack: [] as HistoryEntry[],
  }),

  getters: {
    canUndo: state => state.undoStack.length > 0,
    canRedo: state => state.redoStack.length > 0,
  },

  actions: {
    push(grid: GridState, label: string) {
      this.undoStack.push({ grid: cloneGrid(grid), label })
      if (this.undoStack.length > MAX_STACK) {
        this.undoStack.shift()
      }
      this.redoStack = []
    },

    undo(currentGrid: GridState): GridState | null {
      if (!this.canUndo) return null
      this.redoStack.push({ grid: cloneGrid(currentGrid), label: 'redo' })
      const entry = this.undoStack.pop()!
      return cloneGrid(entry.grid)
    },

    redo(currentGrid: GridState): GridState | null {
      if (!this.canRedo) return null
      this.undoStack.push({ grid: cloneGrid(currentGrid), label: 'undo' })
      const entry = this.redoStack.pop()!
      return cloneGrid(entry.grid)
    },

    clear() {
      this.undoStack = []
      this.redoStack = []
    },
  },
})
