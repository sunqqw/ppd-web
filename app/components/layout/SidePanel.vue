<script setup lang="ts">
import { NTabs, NTabPane, NSwitch } from 'naive-ui'
import ColorPanel from '~/components/panel/ColorPanel.vue'
import SizePanel from '~/components/panel/SizePanel.vue'
import ImagePanel from '~/components/panel/ImagePanel.vue'
import MergePanel from '~/components/panel/MergePanel.vue'
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()

const activeTab = ref('color')
const panelRef = ref<HTMLElement | null>(null)

const { animateSidePanel, tabContentEnter, pressFeedback, releaseFeedback } = useGsapMotion()

const tabs = [
  { name: 'color', label: '色号', icon: '🎨' },
  { name: 'size', label: '尺寸', icon: '📐' },
  { name: 'image', label: '转图', icon: '🖼️' },
  { name: 'merge', label: '优化', icon: '✨' },
]

const activeTabLabel = computed(() =>
  tabs.find(t => t.name === activeTab.value)?.label ?? '',
)

function expandToTab(name: string) {
  activeTab.value = name
  settingsStore.setSidePanelCollapsed(false)
}

function onRailPress(e: MouseEvent) {
  pressFeedback(e.currentTarget as Element)
}

function onRailRelease(e: MouseEvent) {
  releaseFeedback(e.currentTarget as Element)
}

watch(() => settingsStore.sidePanelCollapsed, (collapsed) => {
  if (panelRef.value) animateSidePanel(panelRef.value, collapsed)
})

watch(activeTab, () => {
  nextTick(() => {
    const body = panelRef.value?.querySelector('.side-panel-body')
    if (body instanceof HTMLElement) tabContentEnter(body)
  })
})

onMounted(() => {
  if (panelRef.value) {
    const { gsap } = useGSAP()
    gsap.set(panelRef.value, {
      width: settingsStore.sidePanelCollapsed ? 56 : 288,
    })
  }
})
</script>

<template>
  <aside ref="panelRef" class="side-panel" :class="{ collapsed: settingsStore.sidePanelCollapsed }">
    <div class="side-panel-header">
      <template v-if="!settingsStore.sidePanelCollapsed">
        <div class="side-panel-title">
          <span class="side-panel-title-text">{{ activeTabLabel }}</span>
          <span class="side-panel-title-sub">属性面板</span>
        </div>
        <button
          class="side-panel-toggle"
          title="收起侧栏"
          @click="settingsStore.setSidePanelCollapsed(true)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </template>
      <button
        v-else
        class="side-panel-toggle expand"
        title="展开侧栏"
        @click="settingsStore.setSidePanelCollapsed(false)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
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
        @mousedown="onRailPress"
        @mouseup="onRailRelease"
        @mouseleave="onRailRelease"
      >
        {{ tab.icon }}
      </button>
    </div>

    <div v-show="!settingsStore.sidePanelCollapsed" class="side-panel-body">
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
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
  width: var(--ws-panel-w);
  background: var(--ws-surface);
  border: 1px solid var(--ws-border);
  border-radius: var(--ws-radius);
  box-shadow: var(--ws-shadow-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.side-panel.collapsed {
  width: 56px;
}

.side-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--ws-border-subtle);
  flex-shrink: 0;
  min-height: 48px;
  background: var(--ws-surface-raised);
}

.side-panel.collapsed .side-panel-header {
  justify-content: center;
  padding: 10px 8px;
}

.side-panel-title {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.side-panel-title-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--ws-text);
}

.side-panel-title-sub {
  font-size: 11px;
  color: var(--ws-text-muted);
}

.side-panel-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--ws-radius-sm);
  color: var(--ws-text-secondary);
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.side-panel-toggle:hover {
  background: var(--ws-border-subtle);
  color: var(--ws-text);
}

.side-panel-toggle.expand {
  width: 36px;
  height: 36px;
}

.side-panel-options {
  padding: 8px 0 4px;
  border-bottom: 1px solid var(--ws-border-subtle);
  margin-bottom: 4px;
}

.side-panel-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ws-text-secondary);
  cursor: pointer;
  user-select: none;
}

.side-panel-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  flex: 1;
}

.rail-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--ws-radius-sm);
  font-size: 18px;
  color: var(--ws-text-secondary);
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.rail-tab:hover {
  background: var(--ws-border-subtle);
  color: var(--ws-text);
}

.rail-tab.active {
  background: var(--ws-primary-soft);
  color: var(--ws-primary);
  box-shadow: inset 0 0 0 1px rgba(32, 128, 240, 0.12);
}

.side-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 12px;
}

.side-panel-body :deep(.n-tabs-nav) {
  padding-top: 4px;
}
</style>
