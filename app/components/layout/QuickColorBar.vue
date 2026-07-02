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

function selectColor(colorId: string) {
  canvasStore.setSelectedColor(colorId)
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
      :title="colorId ?? '未设置'"
      :disabled="!colorId"
      @click="colorId && selectColor(colorId)"
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
  width: 36px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid #ddd;
  cursor: pointer;
  transition: transform 0.1s, border-color 0.1s;
  overflow: hidden;
}

.quick-color-slot.empty {
  background: #f5f5f5;
  cursor: default;
  opacity: 0.5;
}

.quick-color-slot:not(.empty):hover {
  transform: scale(1.08);
}

.quick-color-slot.selected {
  border-color: #2080f0;
  box-shadow: 0 0 0 2px rgba(32, 128, 240, 0.3);
}

.quick-color-label {
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}
</style>
