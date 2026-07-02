<script setup lang="ts">
import { NSlider, NButton, NText, useMessage } from 'naive-ui'
import { useSettingsStore } from '~/stores/settings'
import { useImagePipeline } from '~/composables/useImagePipeline'
import { usePaletteStore } from '~/stores/palette'
import { useCanvasStore } from '~/stores/canvas'
import { useHistoryStore } from '~/stores/history'

const settingsStore = useSettingsStore()
const { applyMerge } = useImagePipeline()
const paletteStore = usePaletteStore()
const canvasStore = useCanvasStore()
const historyStore = useHistoryStore()
const message = useMessage()

const merging = ref(false)

async function onMerge() {
  merging.value = true
  try {
    await applyMerge()
    message.success('颜色合并完成')
  }
  catch {
    message.error('合并失败')
  }
  finally {
    merging.value = false
  }
}

function onRematch() {
  historyStore.push(canvasStore.grid, '重新匹配色号')
  const matcher = paletteStore.matcher
  for (const cell of canvasStore.grid.cells) {
    if (!cell.colorId) continue
    const hex = matcher.getHex(cell.colorId)
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    cell.colorId = matcher.findNearest(r, g, b)
  }
  message.success('色号已重新匹配')
}
</script>

<template>
  <div>
    <div class="panel-section">
      <div class="panel-section-title">
        自动颜色合并
      </div>
      <NText depth="3" style="font-size: 12px; display: block; margin-bottom: 8px">
        BFS 连通区域检测，清理杂色
      </NText>
      <div class="panel-section-title">
        相似度阈值：{{ settingsStore.imageParams.mergeThreshold }}
      </div>
      <NSlider
        :value="settingsStore.imageParams.mergeThreshold"
        :min="0"
        :max="100"
        @update:value="(v: number) => settingsStore.setImageParams({ mergeThreshold: v })"
      />
      <div class="panel-section-title" style="margin-top: 8px">
        最小区域：{{ settingsStore.imageParams.minRegionSize }} 格
      </div>
      <NSlider
        :value="settingsStore.imageParams.minRegionSize"
        :min="1"
        :max="10"
        :step="1"
        @update:value="(v: number) => settingsStore.setImageParams({ minRegionSize: v })"
      />
      <NButton
        type="primary"
        size="small"
        block
        style="margin-top: 12px"
        :loading="merging"
        @click="onMerge"
      >
        执行颜色合并
      </NButton>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">
        全局操作
      </div>
      <NButton size="small" block @click="onRematch">
        重新匹配色号库
      </NButton>
    </div>
  </div>
</template>
