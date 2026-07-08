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

function onQuickColorClick(index: number, colorId: string | null, e: MouseEvent) {
  const selected = canvasStore.selectedColorId
  if (!colorId) {
    if (selected) settingsStore.setQuickColor(index, selected)
    return
  }
  if (selected && (e.altKey || selected !== colorId)) {
    settingsStore.setQuickColor(index, selected)
    return
  }
  canvasStore.setSelectedColor(colorId)
}

function onQuickColorContextMenu(index: number, colorId: string | null, e: MouseEvent) {
  if (!colorId) return
  e.preventDefault()
  settingsStore.setQuickColor(index, null)
}

const { colorSelectPulse } = useGsapMotion()

function onColorSelect(colorId: string, e: MouseEvent) {
  canvasStore.setSelectedColor(colorId)
  colorSelectPulse(e.currentTarget as Element)
}

function onQuickColorClickWithPulse(index: number, colorId: string | null, e: MouseEvent) {
  onQuickColorClick(index, colorId, e)
  if (colorId && !e.altKey) {
    colorSelectPulse(e.currentTarget as Element)
  }
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
        选中色号后点击空位添加、点击已有色块替换，右键清除
      </p>
      <div class="quick-colors-grid">
        <button
          v-for="(colorId, index) in settingsStore.quickColors"
          :key="index"
          class="quick-color-slot"
          :class="{ empty: !colorId, selected: colorId && canvasStore.selectedColorId === colorId }"
          :style="colorId ? { background: getHex(colorId) ?? '#ccc' } : undefined"
          :title="colorId ? `${colorId}（选中其他色后点击替换，右键清除）` : '点击添加当前选中色'"
          @click="onQuickColorClickWithPulse(index, colorId, $event)"
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
          @click="onColorSelect(color.id, $event)"
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
  color: var(--ws-primary);
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
  border-radius: var(--ws-radius-sm);
  border: 2px dashed var(--ws-border);
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s, box-shadow 0.12s;
  overflow: hidden;
}

.quick-color-slot.empty {
  background: var(--ws-surface-raised);
}

.quick-color-slot.empty:hover {
  border-color: var(--ws-primary);
  background: var(--ws-primary-soft);
}

.quick-color-slot:not(.empty) {
  border-style: solid;
  border-color: transparent;
}

.quick-color-slot:not(.empty):hover {
  transform: scale(1.05);
}

.quick-color-slot.selected {
  border-color: var(--ws-primary);
  box-shadow: 0 0 0 2px var(--ws-primary-ring);
}

.quick-color-add {
  font-size: 18px;
  color: #bbb;
  line-height: 1;
}

@media (max-width: 700px) {
  .color-panel {
    max-height: none;
  }

  .quick-colors-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .color-grid {
    gap: 5px;
  }

  .color-swatch {
    width: 34px;
    height: 34px;
  }
}
</style>
