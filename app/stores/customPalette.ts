import { defineStore } from 'pinia'
import type { CustomPaletteRecord } from '../../lib/types/palette'

const STORAGE_KEY = 'ppd-custom-palettes-v1'

function createId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `cp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useCustomPaletteStore = defineStore('customPalette', {
  state: () => ({
    items: [] as CustomPaletteRecord[],
    loaded: false,
  }),

  getters: {
    getById: state => (id: string) => state.items.find(item => item.id === id),
  },

  actions: {
    load() {
      if (this.loaded) return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as CustomPaletteRecord[]
          if (Array.isArray(parsed)) {
            this.items = parsed
          }
        }
      }
      catch { /* ignore corrupt data */ }
      this.loaded = true
    },

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
      }
      catch { /* quota exceeded */ }
    },

    create(input: {
      name: string
      basePaletteKey: string
      colorIds: string[]
    }): CustomPaletteRecord {
      const now = Date.now()
      const record: CustomPaletteRecord = {
        id: createId(),
        name: input.name.trim(),
        basePaletteKey: input.basePaletteKey,
        colorIds: [...new Set(input.colorIds)],
        createdAt: now,
        updatedAt: now,
      }
      this.items.push(record)
      this.persist()
      return record
    },

    update(id: string, input: {
      name?: string
      basePaletteKey?: string
      colorIds?: string[]
    }): boolean {
      const record = this.items.find(item => item.id === id)
      if (!record) return false

      if (input.name !== undefined) record.name = input.name.trim()
      if (input.basePaletteKey !== undefined) record.basePaletteKey = input.basePaletteKey
      if (input.colorIds !== undefined) record.colorIds = [...new Set(input.colorIds)]
      record.updatedAt = Date.now()
      this.persist()
      return true
    },

    remove(id: string): boolean {
      const index = this.items.findIndex(item => item.id === id)
      if (index === -1) return false
      this.items.splice(index, 1)
      this.persist()
      return true
    },
  },
})
