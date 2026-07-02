import { defineStore } from 'pinia'
import {
  type ImagePipelineParams,
  DEFAULT_IMAGE_PARAMS,
} from '../../lib/types/grid'

export type ToolType = 'brush' | 'eraser' | 'fill' | 'picker' | 'select'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    imageParams: { ...DEFAULT_IMAGE_PARAMS } as ImagePipelineParams,
    showGrid: true,
    showColorLabels: true,
    showCoordinates: false,
    tool: 'brush' as ToolType,
    brushSize: 1,
    isPanning: false,
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
  },
})
