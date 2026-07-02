<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'
import { isLightColor } from '../../../lib/color/rgb'

const settingsStore = useSettingsStore()
const canvasStore = useCanvasStore()
const paletteStore = usePaletteStore()

function getHex(colorId: string | null) {
  if (!colorId) return null
  return paletteStore.matcher.getHex(colorId)
}

function labelColor(hex: string) {
  return isLightColor(hex) ? '#333' : '#fff'
}

function onQuickColorClick(index: number, colorId: string | null, e: MouseEvent) {
  if (!colorId) {
    if (canvasStore.selectedColorId) {
      settingsStore.setQuickColor(index, canvasStore.selectedColorId)
    }
    return
  }
  if (e.altKey && canvasStore.selectedColorId) {
    settingsStore.setQuickColor(index, canvasStore.selectedColorId)
    return
  }
  canvasStore.setSelectedColor(colorId)
}

const { colorSelectPulse } = useGsapMotion()

function onQuickColorClickWithMotion(index: number, colorId: string | null, e: MouseEvent) {
  onQuickColorClick(index, colorId, e)
  if (colorId && !e.altKey) {
    colorSelectPulse(e.currentTarget as Element)
  }
}
</script>

<template>
  <div v-if="settingsStore.showQuickColors" class="quick-color-bar">
    <button
      v-for="(colorId, index) in settingsStore.quickColors"
      :key="index"
      class="quick-color-slot"
      :class="{ empty: !colorId, selected: colorId && canvasStore.selectedColorId === colorId }"
      :style="colorId ? { background: getHex(colorId) ?? '#ccc' } : undefined"
      :title="colorId ? `${colorId}（Alt+点击替换）` : (canvasStore.selectedColorId ? '点击添加当前选中色' : '未设置')"
      @click="onQuickColorClickWithMotion(index, colorId, $event)"
    >
      <span
        v-if="colorId"
        class="quick-color-label"
        :style="{ color: labelColor(getHex(colorId) ?? '#ccc') }"
      >{{ colorId }}</span>
    </button>
  </div>
</template>

<style scoped>
.quick-color-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.quick-color-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid var(--ws-border);
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s, box-shadow 0.12s;
  overflow: hidden;
}

.quick-color-slot.empty {
  background: var(--ws-surface-raised);
  cursor: pointer;
  opacity: 0.75;
}

.quick-color-slot.empty:hover {
  opacity: 1;
  border-color: var(--ws-primary);
  background: var(--ws-primary-soft);
}

.quick-color-slot:not(.empty):hover {
  transform: scale(1.06);
}

.quick-color-slot.selected {
  border-color: var(--ws-primary);
  box-shadow: 0 0 0 2px var(--ws-primary-ring);
}

.quick-color-label {
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}
</style>
