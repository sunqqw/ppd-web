import { defineStore } from 'pinia'
import {
  type ImagePipelineParams,
  DEFAULT_IMAGE_PARAMS,
} from '../../lib/types/grid'

export type ToolType = 'brush' | 'eraser' | 'fill' | 'picker' | 'select'

export const QUICK_COLOR_SLOTS = 6

const UI_SETTINGS_KEY = 'ppd-ui-settings-v1'

interface UiSettings {
  sidePanelCollapsed: boolean
  showQuickColors: boolean
  quickColors: (string | null)[]
  canvasFixed: boolean
}

function defaultQuickColors(): (string | null)[] {
  return Array.from({ length: QUICK_COLOR_SLOTS }, () => null)
}

function loadUiSettings(): Partial<UiSettings> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<UiSettings>
    if (Array.isArray(parsed.quickColors)) {
      parsed.quickColors = parsed.quickColors.slice(0, QUICK_COLOR_SLOTS)
      while (parsed.quickColors.length < QUICK_COLOR_SLOTS) {
        parsed.quickColors.push(null)
      }
    }
    return parsed
  }
  catch {
    return {}
  }
}

function persistUiSettings(settings: UiSettings) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings))
  }
  catch { /* quota exceeded */ }
}

const savedUi = loadUiSettings()

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    imageParams: { ...DEFAULT_IMAGE_PARAMS } as ImagePipelineParams,
    showGrid: true,
    showColorLabels: true,
    showCoordinates: false,
    tool: 'brush' as ToolType,
    brushSize: 1,
    isPanning: false,
    canvasFixed: savedUi.canvasFixed ?? true,
    sidePanelCollapsed: savedUi.sidePanelCollapsed ?? false,
    showQuickColors: savedUi.showQuickColors ?? true,
    quickColors: savedUi.quickColors ?? defaultQuickColors(),
  }),

  actions: {
    setTool(tool: ToolType) {
      this.tool = tool
    },

    setImageParams(partial: Partial<ImagePipelineParams>) {
      Object.assign(this.imageParams, partial)
    },

    toggleGrid() {
      this.showGrid = !this.showGrid
    },

    toggleColorLabels() {
      this.showColorLabels = !this.showColorLabels
    },

    toggleCanvasFixed() {
      this.canvasFixed = !this.canvasFixed
      this.saveUiSettings()
    },

    setCanvasFixed(fixed: boolean) {
      this.canvasFixed = fixed
      this.saveUiSettings()
    },

    toggleSidePanel() {
      this.sidePanelCollapsed = !this.sidePanelCollapsed
      this.saveUiSettings()
    },

    setSidePanelCollapsed(collapsed: boolean) {
      this.sidePanelCollapsed = collapsed
      this.saveUiSettings()
    },

    toggleShowQuickColors() {
      this.showQuickColors = !this.showQuickColors
      this.saveUiSettings()
    },

    setShowQuickColors(show: boolean) {
      this.showQuickColors = show
      this.saveUiSettings()
    },

    setQuickColor(index: number, colorId: string | null) {
      if (index < 0 || index >= QUICK_COLOR_SLOTS) return
      this.quickColors[index] = colorId
      this.saveUiSettings()
    },

    saveUiSettings() {
      persistUiSettings({
        sidePanelCollapsed: this.sidePanelCollapsed,
        showQuickColors: this.showQuickColors,
        quickColors: [...this.quickColors],
        canvasFixed: this.canvasFixed,
      })
    },
  },
})
