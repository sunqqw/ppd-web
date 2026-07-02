<script setup lang="ts">
import { NInputNumber, NButton, NSpace, NSlider } from 'naive-ui'
import { useCanvasStore } from '~/stores/canvas'
import { useHistoryStore } from '~/stores/history'

const canvasStore = useCanvasStore()
const historyStore = useHistoryStore()

const templates = [
  { label: '30×30', w: 30, h: 30 },
  { label: '50×50', w: 50, h: 50 },
  { label: '100×100', w: 100, h: 100 },
]

function applySize(w: number, h: number) {
  historyStore.push(canvasStore.grid, '调整尺寸')
  canvasStore.resizeGrid(w, h)
}

function onWidthChange(val: number | null) {
  if (val && val >= 10 && val <= 200) {
    applySize(val, canvasStore.grid.height)
  }
}

function onHeightChange(val: number | null) {
  if (val && val >= 10 && val <= 200) {
    applySize(canvasStore.grid.width, val)
  }
}
</script>

<template>
  <div>
    <div class="panel-section">
      <div class="panel-section-title">
        图纸尺寸
      </div>
      <NSpace :size="8">
        <NInputNumber
          :value="canvasStore.grid.width"
          :min="10"
          :max="200"
          size="small"
          style="width: 100px"
          @update:value="onWidthChange"
        >
          <template #prefix>
            宽
          </template>
        </NInputNumber>
        <span>×</span>
        <NInputNumber
          :value="canvasStore.grid.height"
          :min="10"
          :max="200"
          size="small"
          style="width: 100px"
          @update:value="onHeightChange"
        >
          <template #prefix>
            高
          </template>
        </NInputNumber>
      </NSpace>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">
        常用模板
      </div>
      <NSpace>
        <NButton
          v-for="t in templates"
          :key="t.label"
          size="tiny"
          @click="applySize(t.w, t.h)"
        >
          {{ t.label }}
        </NButton>
      </NSpace>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">
        单颗拼豆像素：{{ canvasStore.transform.cellPixelSize }}px
      </div>
      <NSlider
        :value="canvasStore.transform.cellPixelSize"
        :min="8"
        :max="32"
        :step="1"
        @update:value="(v: number) => canvasStore.setTransform({ cellPixelSize: v })"
      />
    </div>

    <div class="panel-section">
      <div class="panel-section-title">
        统计
      </div>
      <p class="stat-text">
        总颗数：{{ canvasStore.totalBeads }}
      </p>
      <p class="stat-text">
        网格：{{ canvasStore.grid.width }}×{{ canvasStore.grid.height }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.stat-text {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
}
</style>
