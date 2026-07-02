import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'
import { useSettingsStore } from '~/stores/settings'

const DRAFT_KEY = 'ppd-draft-v1'

interface DraftData {
  version: 1
  grid: ReturnType<typeof useCanvasStore>['grid']
  activePaletteKey: string
  imageParams: ReturnType<typeof useSettingsStore>['imageParams']
  transform: ReturnType<typeof useCanvasStore>['transform']
  savedAt: number
}

export function useDraft() {
  const canvasStore = useCanvasStore()
  const paletteStore = usePaletteStore()
  const settingsStore = useSettingsStore()

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function save() {
    const data: DraftData = {
      version: 1,
      grid: canvasStore.grid,
      activePaletteKey: paletteStore.activePaletteKey,
      imageParams: { ...settingsStore.imageParams },
      transform: { ...canvasStore.transform },
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    }
    catch { /* quota exceeded */ }
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 1000)
  }

  function load(): DraftData | null {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      return JSON.parse(raw) as DraftData
    }
    catch {
      return null
    }
  }

  function restore(draft: DraftData) {
    canvasStore.setGrid(draft.grid)
    paletteStore.setActivePalette(draft.activePaletteKey)
    settingsStore.setImageParams(draft.imageParams)
    canvasStore.setTransform(draft.transform)
  }

  function clear() {
    localStorage.removeItem(DRAFT_KEY)
  }

  function hasDraft(): boolean {
    return !!localStorage.getItem(DRAFT_KEY)
  }

  return { save, scheduleSave, load, restore, clear, hasDraft }
}
