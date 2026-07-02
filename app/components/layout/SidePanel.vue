<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui'
import ColorPanel from '~/components/panel/ColorPanel.vue'
import SizePanel from '~/components/panel/SizePanel.vue'
import ImagePanel from '~/components/panel/ImagePanel.vue'
import MergePanel from '~/components/panel/MergePanel.vue'
</script>

<template>
  <aside class="side-panel">
    <NTabs type="line" size="small" animated>
      <NTabPane name="color" tab="色号">
        <ColorPanel />
      </NTabPane>
      <NTabPane name="size" tab="尺寸">
        <SizePanel />
      </NTabPane>
      <NTabPane name="image" tab="转图">
        <ImagePanel />
      </NTabPane>
      <NTabPane name="merge" tab="优化">
        <MergePanel />
      </NTabPane>
    </NTabs>
  </aside>
</template>

<style scoped>
.side-panel {
  width: 280px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  overflow-y: auto;
  flex-shrink: 0;
  padding: 8px 12px;
}
</style>
