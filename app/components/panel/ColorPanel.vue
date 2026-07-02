<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { usePaletteStore } from '~/stores/palette'
import { useCanvasStore } from '~/stores/canvas'
import { isLightColor } from '../../../lib/color/rgb'

const paletteStore = usePaletteStore()
const canvasStore = useCanvasStore()

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
</style>
