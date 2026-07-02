<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { usePaletteStore } from '~/stores/palette'
import { useCanvasStore } from '~/stores/canvas'
import { useSettingsStore, QUICK_COLOR_SLOTS } from '~/stores/settings'
import { isLightColor } from '../../../lib/color/rgb'

const paletteStore = usePaletteStore()
const canvasStore = useCanvasStore()
const settingsStore = useSettingsStore()

const paletteOptions = computed(() => {
  const builtin = paletteStore.builtinPalettes.map(p => ({ label: p.name, value: p.key }))
  const custom = paletteStore.customPalettes.map(p => ({ label: p.name, value: p.key }))
  if (custom.length === 0) {
    return builtin
  }
  return [
    { type: 'group' as const, label: '内置色号库', children: builtin },
    { type: 'group' as const, label: '我的色号库', children: custom },
  ]
})

const groupedColors = computed(() => {
  const groups = new Map<string, typeof paletteStore.activePalette.colors>()
  for (const c of paletteStore.activePalette.colors) {
    if (!groups.has(c.series)) groups.set(c.series, [])
    groups.get(c.series)!.push(c)
  }
  return groups
})

function labelColor(hex: string) {
  return isLightColor(hex) ? '#333' : '#fff'
}

function getHex(colorId: string | null) {
  if (!colorId) return null
  return paletteStore.matcher.getHex(colorId)
}

function onQuickColorClick(index: number, colorId: string | null) {
  if (colorId) {
    canvasStore.setSelectedColor(colorId)
    return
  }
  if (canvasStore.selectedColorId) {
    settingsStore.setQuickColor(index, canvasStore.selectedColorId)
  }
}

function onQuickColorContextMenu(index: number, colorId: string | null, e: MouseEvent) {
  if (!colorId) return
  e.preventDefault()
  settingsStore.setQuickColor(index, null)
}
</script>

<template>
  <div class="color-panel">
    <div class="panel-section">
      <div class="panel-section-title">
        色号库
      </div>
      <NSelect
        :value="paletteStore.activePaletteKey"
        :options="paletteOptions"
        size="small"
        @update:value="paletteStore.setActivePalette"
      />
      <NuxtLink to="/palettes" class="palette-manage-link">
        管理自定义色号库 →
      </NuxtLink>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">
        快捷色号（{{ QUICK_COLOR_SLOTS }}）
      </div>
      <p class="quick-colors-hint">
        点击空位添加当前选中色，点击色块选用，右键清除
      </p>
      <div class="quick-colors-grid">
        <button
          v-for="(colorId, index) in settingsStore.quickColors"
          :key="index"
          class="quick-color-slot"
          :class="{ empty: !colorId, selected: colorId && canvasStore.selectedColorId === colorId }"
          :style="colorId ? { background: getHex(colorId) ?? '#ccc' } : undefined"
          :title="colorId ? `${colorId}（右键清除）` : '点击添加当前选中色'"
          @click="onQuickColorClick(index, colorId)"
          @contextmenu="onQuickColorContextMenu(index, colorId, $event)"
        >
          <span v-if="!colorId" class="quick-color-add">+</span>
          <span
            v-else
            class="color-swatch-label"
            :style="{ color: labelColor(getHex(colorId) ?? '#ccc') }"
          >{{ colorId }}</span>
        </button>
      </div>
    </div>

    <div v-for="[series, colors] in groupedColors" :key="series" class="panel-section">
      <div class="panel-section-title">
        {{ colors[0]?.seriesName ?? series }}
      </div>
      <div class="color-grid">
        <div
          v-for="color in colors"
          :key="color.id"
          class="color-swatch"
          :class="{ selected: canvasStore.selectedColorId === color.id }"
          :style="{ background: color.hex }"
          :title="color.id"
          @click="canvasStore.setSelectedColor(color.id)"
        >
          <span
            class="color-swatch-label"
            :style="{ color: labelColor(color.hex) }"
          >{{ color.id }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-panel {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.palette-manage-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: #2080f0;
}

.palette-manage-link:hover {
  text-decoration: underline;
}

.quick-colors-hint {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
  line-height: 1.4;
}

.quick-colors-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.quick-color-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: 8px;
  border: 2px dashed #ddd;
  cursor: pointer;
  transition: transform 0.1s, border-color 0.1s;
  overflow: hidden;
}

.quick-color-slot.empty {
  background: #fafafa;
}

.quick-color-slot.empty:hover {
  border-color: #2080f0;
  background: #f0f7ff;
}

.quick-color-slot:not(.empty) {
  border-style: solid;
  border-color: transparent;
}

.quick-color-slot:not(.empty):hover {
  transform: scale(1.05);
}

.quick-color-slot.selected {
  border-color: #2080f0;
  box-shadow: 0 0 0 2px rgba(32, 128, 240, 0.3);
}

.quick-color-add {
  font-size: 18px;
  color: #bbb;
  line-height: 1;
}
</style>
