<script setup lang="ts">
import { useSettingsStore, type ToolType } from '~/stores/settings'
import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'
import QuickColorBar from '~/components/layout/QuickColorBar.vue'

const settingsStore = useSettingsStore()
const canvasStore = useCanvasStore()
const paletteStore = usePaletteStore()

const tools: { key: ToolType, label: string, icon: string }[] = [
  { key: 'brush', label: '画笔', icon: '✏️' },
  { key: 'eraser', label: '橡皮', icon: '🧹' },
  { key: 'fill', label: '填充', icon: '🪣' },
  { key: 'picker', label: '取色', icon: '💉' },
  { key: 'select', label: '框选', icon: '⬚' },
]

const currentColor = computed(() => {
  if (!canvasStore.selectedColorId) return '#ffffff'
  return paletteStore.matcher.getHex(canvasStore.selectedColorId)
})
</script>

<template>
  <aside class="toolbar">
    <div class="current-color" :style="{ background: currentColor }" :title="canvasStore.selectedColorId ?? '未选色'" />
    <QuickColorBar />
    <div class="tool-divider" />
    <button
      v-for="tool in tools"
      :key="tool.key"
      class="tool-btn"
      :class="{ active: settingsStore.tool === tool.key }"
      :title="tool.label"
      @click="settingsStore.setTool(tool.key)"
    >
      {{ tool.icon }}
    </button>
    <div class="tool-divider" />
    <div class="brush-size">
      <span class="brush-label">笔刷</span>
      <input
        v-model.number="settingsStore.brushSize"
        type="range"
        min="1"
        max="5"
        step="1"
      >
    </div>
    <div class="tool-divider" />
    <button
      class="tool-btn"
      :class="{ active: settingsStore.showGrid }"
      title="显示网格"
      @click="settingsStore.toggleGrid()"
    >
      #
    </button>
    <button
      class="tool-btn"
      :class="{ active: settingsStore.showColorLabels }"
      title="显示色号"
      @click="settingsStore.toggleColorLabels()"
    >
      <span class="tool-label-icon">A1</span>
    </button>
  </aside>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 56px;
  padding: 12px 8px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  gap: 4px;
  flex-shrink: 0;
}

.current-color {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid #ddd;
  margin-bottom: 4px;
}

.tool-divider {
  width: 32px;
  height: 1px;
  background: #eee;
  margin: 4px 0;
}

.brush-size {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.brush-label {
  font-size: 10px;
  color: #999;
}

.brush-size input {
  width: 40px;
  writing-mode: vertical-lr;
  direction: rtl;
}

.tool-label-icon {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
</style>
