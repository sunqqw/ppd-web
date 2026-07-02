<script setup lang="ts">
import { NSlider, NSwitch, NText } from 'naive-ui'
import { useSettingsStore } from '~/stores/settings'
import { useImagePipeline } from '~/composables/useImagePipeline'

const settingsStore = useSettingsStore()
const { lastStats } = useImagePipeline()
</script>

<template>
  <div>
    <div class="panel-section">
      <div class="panel-section-title">
        精细度：{{ settingsStore.imageParams.detail }}
      </div>
      <NSlider
        :value="settingsStore.imageParams.detail"
        :min="0"
        :max="100"
        @update:value="(v: number) => settingsStore.setImageParams({ detail: v })"
      />
      <NText depth="3" style="font-size: 12px">
        低精细度简化色块，高精细度保留细节
      </NText>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">
        背景智能移除
      </div>
      <NSwitch
        :value="settingsStore.imageParams.removeBackground"
        @update:value="(v: boolean) => settingsStore.setImageParams({ removeBackground: v })"
      />
    </div>

    <div v-if="settingsStore.imageParams.removeBackground" class="panel-section">
      <div class="panel-section-title">
        背景容差：{{ settingsStore.imageParams.bgTolerance }}
      </div>
      <NSlider
        :value="settingsStore.imageParams.bgTolerance"
        :min="0"
        :max="100"
        @update:value="(v: number) => settingsStore.setImageParams({ bgTolerance: v })"
      />
    </div>

    <div v-if="lastStats" class="panel-section">
      <div class="panel-section-title">
        上次转换统计
      </div>
      <NText depth="3" style="font-size: 12px">
        用色 {{ lastStats.colorCount }} 种，耗时 {{ lastStats.processingMs }}ms
      </NText>
    </div>

    <div class="panel-section">
      <NText depth="3" style="font-size: 12px">
        导入图片后自动执行：背景移除 → 全图量化 → 描边优先降采样 → 轮廓补全 → 填充色合并
      </NText>
    </div>
  </div>
</template>
