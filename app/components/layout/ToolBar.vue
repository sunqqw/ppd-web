<script setup lang="ts">
import { NTooltip } from 'naive-ui'
import { useSettingsStore, type ToolType } from '~/stores/settings'
import { useCanvasStore } from '~/stores/canvas'
import { usePaletteStore } from '~/stores/palette'
import QuickColorBar from '~/components/layout/QuickColorBar.vue'

const settingsStore = useSettingsStore()
const canvasStore = useCanvasStore()
const paletteStore = usePaletteStore()

const toolbarRef = ref<HTMLElement | null>(null)
const colorRef = ref<HTMLElement | null>(null)

const { staggerIn, pulseActive, pressFeedback, releaseFeedback } = useGsapMotion()

const tools: { key: ToolType, label: string, icon: string }[] = [
  { key: 'brush', label: '画笔', icon: '✏️' },
  { key: 'eraser', label: '橡皮', icon: '🧹' },
  { key: 'fill', label: '填充', icon: '🪣' },
  { key: 'picker', label: '取色', icon: '💉' },
  { key: 'select', label: '框选', icon: '⬚' },
  { key: 'pan', label: '平移', icon: '✋' },
]

const viewTools = [
  { key: 'canvasFixed', label: '固定画布', icon: '📌', active: () => settingsStore.canvasFixed, toggle: () => settingsStore.toggleCanvasFixed() },
  { key: 'showGrid', label: '显示网格', icon: '#', active: () => settingsStore.showGrid, toggle: () => settingsStore.toggleGrid() },
  { key: 'showCoordinates', label: '显示坐标', icon: '123', active: () => settingsStore.showCoordinates, toggle: () => settingsStore.toggleCoordinates(), textIcon: true },
  { key: 'showColorLabels', label: '显示色号', icon: 'A1', active: () => settingsStore.showColorLabels, toggle: () => settingsStore.toggleColorLabels(), textIcon: true },
] as const

const currentColor = computed(() => {
  if (!canvasStore.selectedColorId) return '#ffffff'
  return paletteStore.matcher.getHex(canvasStore.selectedColorId)
})

function onPress(e: MouseEvent) {
  pressFeedback(e.currentTarget as Element)
}

function onRelease(e: MouseEvent) {
  releaseFeedback(e.currentTarget as Element)
}

watch(() => settingsStore.tool, () => {
  nextTick(() => {
    const active = toolbarRef.value?.querySelector('.tool-btn.active')
    pulseActive(active)
  })
})

watch(() => canvasStore.selectedColorId, () => {
  pulseActive(colorRef.value)
})

onMounted(() => {
  if (toolbarRef.value) {
    staggerIn(toolbarRef.value, '.tool-btn, .current-color, .quick-color-slot')
  }
})
</script>

<template>
  <aside ref="toolbarRef" class="toolbar">
    <div class="toolbar-section">
      <span class="toolbar-label">当前色</span>
      <div
        ref="colorRef"
        class="current-color"
        :style="{ background: currentColor }"
        :title="canvasStore.selectedColorId ?? '未选色'"
      >
        <span v-if="canvasStore.selectedColorId" class="current-color-id">
          {{ canvasStore.selectedColorId }}
        </span>
      </div>
      <QuickColorBar />
    </div>

    <div class="tool-divider" />

    <div class="toolbar-section">
      <span class="toolbar-label">工具</span>
      <NTooltip
        v-for="tool in tools"
        :key="tool.key"
        placement="right"
        :delay="200"
      >
        <template #trigger>
          <button
            class="tool-btn"
            :class="{ active: settingsStore.tool === tool.key }"
            @click="settingsStore.setTool(tool.key)"
            @mousedown="onPress"
            @mouseup="onRelease"
            @mouseleave="onRelease"
          >
            {{ tool.icon }}
          </button>
        </template>
        {{ tool.label }}
      </NTooltip>
    </div>

    <div class="tool-divider" />

    <div class="toolbar-section brush-section">
      <span class="toolbar-label">笔刷 {{ settingsStore.brushSize }}</span>
      <input
        v-model.number="settingsStore.brushSize"
        class="ws-range brush-range"
        type="range"
        min="1"
        max="5"
        step="1"
      >
    </div>

    <div class="tool-divider" />

    <div class="toolbar-section">
      <span class="toolbar-label">视图</span>
      <NTooltip
        v-for="view in viewTools"
        :key="view.key"
        placement="right"
        :delay="200"
      >
        <template #trigger>
          <button
            class="tool-btn"
            :class="{ active: view.active() }"
            @click="view.toggle()"
            @mousedown="onPress"
            @mouseup="onRelease"
            @mouseleave="onRelease"
          >
            <span v-if="view.textIcon" class="tool-label-icon">{{ view.icon }}</span>
            <template v-else>{{ view.icon }}</template>
          </button>
        </template>
        {{ view.label }}
      </NTooltip>
    </div>
  </aside>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: var(--ws-toolbar-w);
  max-height: 100%;
  padding: 12px 8px;
  background: var(--ws-surface);
  border: 1px solid var(--ws-border);
  border-radius: var(--ws-radius);
  box-shadow: var(--ws-shadow-sm);
  gap: 2px;
  flex-shrink: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--ws-border) transparent;
}

.toolbar::-webkit-scrollbar {
  width: 4px;
}

.toolbar::-webkit-scrollbar-thumb {
  background: var(--ws-border);
  border-radius: 2px;
}

.toolbar::-webkit-scrollbar-track {
  background: transparent;
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.toolbar-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--ws-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.current-color {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--ws-radius-sm);
  border: 2px solid var(--ws-border);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
}

.current-color-id {
  font-size: 7px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
  padding: 2px;
  line-height: 1;
  pointer-events: none;
}

.tool-divider {
  width: 36px;
  height: 1px;
  background: var(--ws-border-subtle);
  margin: 8px 0;
}

.tool-label-icon {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.brush-section {
  padding: 4px 0;
}

.brush-range {
  margin: 2px 0;
}

@media (max-width: 700px) {
  .toolbar {
    order: 2;
    flex-direction: row;
    align-items: stretch;
    width: 100%;
    max-width: 100%;
    padding: 8px;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .toolbar-section {
    flex-direction: row;
    flex-shrink: 0;
    width: auto;
  }

  .toolbar-label {
    display: none;
  }

  .current-color {
    width: 40px;
    height: 40px;
  }

  .tool-divider {
    width: 1px;
    height: 40px;
    margin: 0;
    flex-shrink: 0;
  }

  .brush-section {
    min-width: 124px;
    padding: 0;
  }

  .brush-range {
    width: 96px;
    height: 4px;
    margin: 0 6px;
    writing-mode: horizontal-tb;
    direction: ltr;
  }
}

@media (max-width: 480px) {
  .toolbar {
    gap: 6px;
  }

  .current-color {
    width: 38px;
    height: 38px;
  }
}
</style>
