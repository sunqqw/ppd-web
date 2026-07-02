<script setup lang="ts">
import { NTabs, NTabPane, NSwitch } from 'naive-ui'
import ColorPanel from '~/components/panel/ColorPanel.vue'
import SizePanel from '~/components/panel/SizePanel.vue'
import ImagePanel from '~/components/panel/ImagePanel.vue'
import MergePanel from '~/components/panel/MergePanel.vue'
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()

const activeTab = ref('color')

const tabs = [
  { name: 'color', label: '色号', icon: '🎨' },
  { name: 'size', label: '尺寸', icon: '📐' },
  { name: 'image', label: '转图', icon: '🖼️' },
  { name: 'merge', label: '优化', icon: '✨' },
]

function expandToTab(name: string) {
  activeTab.value = name
  settingsStore.setSidePanelCollapsed(false)
}
</script>

<template>
  <aside class="side-panel" :class="{ collapsed: settingsStore.sidePanelCollapsed }">
    <div class="side-panel-header">
      <template v-if="!settingsStore.sidePanelCollapsed">
        <button
          class="side-panel-toggle"
          title="收起侧栏"
          @click="settingsStore.setSidePanelCollapsed(true)"
        >
          »
        </button>
        <div class="side-panel-options">
          <label class="side-panel-option">
            <NSwitch
              :value="settingsStore.showQuickColors"
              size="small"
              @update:value="settingsStore.setShowQuickColors"
            />
            <span>快捷色号栏</span>
          </label>
        </div>
      </template>
      <button
        v-else
        class="side-panel-toggle expand"
        title="展开侧栏"
        @click="settingsStore.setSidePanelCollapsed(false)"
      >
        «
      </button>
    </div>

    <div v-if="settingsStore.sidePanelCollapsed" class="side-panel-rail">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="rail-tab"
        :class="{ active: activeTab === tab.name }"
        :title="tab.label"
        @click="expandToTab(tab.name)"
      >
        {{ tab.icon }}
      </button>
    </div>

    <div v-show="!settingsStore.sidePanelCollapsed" class="side-panel-body">
      <NTabs v-model:value="activeTab" type="line" size="small" animated>
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
    </div>
  </aside>
</template>

<style scoped>
.side-panel {
  width: 280px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.side-panel.collapsed {
  width: 52px;
}

.side-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  min-height: 44px;
}

.side-panel.collapsed .side-panel-header {
  justify-content: center;
  padding: 8px 6px;
}

.side-panel-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: #666;
  font-size: 16px;
  transition: background 0.15s;
  flex-shrink: 0;
}

.side-panel-toggle:hover {
  background: #f0f0f0;
}

.side-panel-toggle.expand {
  width: 36px;
}

.side-panel-options {
  flex: 1;
  min-width: 0;
  margin-left: 8px;
}

.side-panel-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  user-select: none;
}

.side-panel-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  flex: 1;
}

.rail-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 18px;
  transition: background 0.15s;
}

.rail-tab:hover {
  background: #f0f0f0;
}

.rail-tab.active {
  background: #e3f0ff;
}

.side-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 8px;
}
</style>
