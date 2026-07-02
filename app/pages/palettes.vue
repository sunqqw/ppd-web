<script setup lang="ts">
import {
  NButton,
  NCard,
  NEmpty,
  NInput,
  NSelect,
  NSpace,
  NTag,
  NText,
  useDialog,
  useMessage,
} from 'naive-ui'
import { usePaletteStore } from '~/stores/palette'
import { useCustomPaletteStore } from '~/stores/customPalette'
import { isLightColor } from '../../lib/color/rgb'
import type { PaletteColor } from '../../lib/types/palette'

const paletteStore = usePaletteStore()
const customPaletteStore = useCustomPaletteStore()
const message = useMessage()
const dialog = useDialog()

const editingId = ref<string | null>(null)
const formName = ref('')
const formBaseKey = ref('mard291')
const selectedColorIds = ref<Set<string>>(new Set())
const searchQuery = ref('')

const basePaletteOptions = computed(() =>
  paletteStore.builtinPalettes.map(p => ({ label: p.name, value: p.key })),
)

const basePalette = computed(() =>
  paletteStore.builtinPalettes.find(p => p.key === formBaseKey.value)
  ?? paletteStore.builtinPalettes[0],
)

const groupedColors = computed(() => {
  const groups = new Map<string, PaletteColor[]>()
  const query = searchQuery.value.trim().toLowerCase()
  for (const color of basePalette.value.colors) {
    if (query && !color.id.toLowerCase().includes(query) && !color.seriesName.includes(query)) {
      continue
    }
    if (!groups.has(color.series)) groups.set(color.series, [])
    groups.get(color.series)!.push(color)
  }
  return groups
})

const selectedCount = computed(() => selectedColorIds.value.size)
const totalCount = computed(() => basePalette.value.colors.length)

function labelColor(hex: string) {
  return isLightColor(hex) ? '#333' : '#fff'
}

function isSelected(id: string) {
  return selectedColorIds.value.has(id)
}

function toggleColor(id: string) {
  const next = new Set(selectedColorIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedColorIds.value = next
}

function selectAll() {
  selectedColorIds.value = new Set(basePalette.value.colors.map(c => c.id))
}

function selectNone() {
  selectedColorIds.value = new Set()
}

function selectSeries(series: string) {
  const colors = groupedColors.value.get(series) ?? []
  const next = new Set(selectedColorIds.value)
  for (const c of colors) next.add(c.id)
  selectedColorIds.value = next
}

function deselectSeries(series: string) {
  const colors = groupedColors.value.get(series) ?? []
  const next = new Set(selectedColorIds.value)
  for (const c of colors) next.delete(c.id)
  selectedColorIds.value = next
}

function resetForm() {
  editingId.value = null
  formName.value = ''
  formBaseKey.value = 'mard291'
  selectedColorIds.value = new Set()
  searchQuery.value = ''
}

function startCreate() {
  resetForm()
}

function startEdit(id: string) {
  const record = customPaletteStore.getById(id)
  if (!record) return
  editingId.value = id
  formName.value = record.name
  formBaseKey.value = record.basePaletteKey
  selectedColorIds.value = new Set(record.colorIds)
  searchQuery.value = ''
}

function onBasePaletteChange(key: string) {
  formBaseKey.value = key
  selectedColorIds.value = new Set()
}

function savePalette() {
  const name = formName.value.trim()
  if (!name) {
    message.warning('请输入色号库名称')
    return
  }
  if (selectedColorIds.value.size === 0) {
    message.warning('请至少选择一种豆子颜色')
    return
  }

  const colorIds = [...selectedColorIds.value]
  if (editingId.value) {
    customPaletteStore.update(editingId.value, {
      name,
      basePaletteKey: formBaseKey.value,
      colorIds,
    })
    message.success('色号库已更新')
  }
  else {
    const record = customPaletteStore.create({
      name,
      basePaletteKey: formBaseKey.value,
      colorIds,
    })
    editingId.value = record.id
    message.success('色号库已创建')
  }
}

function deletePalette(id: string) {
  const record = customPaletteStore.getById(id)
  if (!record) return

  dialog.warning({
    title: '删除色号库',
    content: `确定删除「${record.name}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      customPaletteStore.remove(id)
      if (editingId.value === id) resetForm()
      if (paletteStore.activePaletteKey === `custom:${id}`) {
        paletteStore.setActivePalette('mard291')
      }
      message.success('已删除')
    },
  })
}

function usePalette(id: string) {
  paletteStore.setActivePalette(`custom:${id}`)
  message.success('已切换色号库，返回工作台即可使用')
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('zh-CN')
}

const pageRef = ref<HTMLElement | null>(null)
const { pageEnter, colorSelectPulse } = useGsapMotion()

function onColorToggle(colorId: string, el: Event) {
  toggleColor(colorId)
  colorSelectPulse(el.currentTarget as Element)
}

onMounted(() => {
  if (pageRef.value) pageEnter(pageRef.value)
})
</script>

<template>
  <div ref="pageRef" class="palettes-page">
    <header class="palettes-header page-header">
      <NuxtLink to="/">
        <NButton quaternary>
          ← 返回工作台
        </NButton>
      </NuxtLink>
      <h1>自定义色号库</h1>
      <NButton type="primary" @click="startCreate">
        新建色号库
      </NButton>
    </header>

    <main class="palettes-main page-main">
      <aside class="palettes-list">
        <NCard title="我的色号库" size="small">
          <NEmpty v-if="customPaletteStore.items.length === 0" description="还没有自定义色号库" />
          <div v-else class="palette-items">
            <div
              v-for="record in customPaletteStore.items"
              :key="record.id"
              class="palette-item"
              :class="{ active: editingId === record.id }"
              @click="startEdit(record.id)"
            >
              <div class="palette-item-name">
                {{ record.name }}
              </div>
              <div class="palette-item-meta">
                <NTag size="small" :bordered="false">
                  {{ record.colorIds.length }} 色
                </NTag>
                <NText depth="3" style="font-size: 12px">
                  {{ formatDate(record.updatedAt) }}
                </NText>
              </div>
              <NSpace :size="4" style="margin-top: 8px" @click.stop>
                <NButton size="tiny" @click="usePalette(record.id)">
                  使用
                </NButton>
                <NButton size="tiny" type="error" quaternary @click="deletePalette(record.id)">
                  删除
                </NButton>
              </NSpace>
            </div>
          </div>
        </NCard>
      </aside>

      <section class="palettes-editor">
        <NCard
          class="editor-card"
          :title="editingId ? '编辑色号库' : '新建色号库'"
          size="small"
        >
          <div class="form-row">
            <label>名称</label>
            <NInput
              v-model:value="formName"
              placeholder="例如：我的 MARD 常备色"
              maxlength="32"
              show-count
            />
          </div>

          <div class="form-row">
            <label>基于品牌色号库</label>
            <NSelect
              :value="formBaseKey"
              :options="basePaletteOptions"
              @update:value="onBasePaletteChange"
            />
            <NText depth="3" style="font-size: 12px; margin-top: 4px; display: block">
              {{ basePalette.info }}
            </NText>
          </div>

          <div class="form-row form-row--grow">
            <div class="form-row-header">
              <label>选择你拥有的豆子</label>
              <NSpace :size="8">
                <NTag :bordered="false" type="info">
                  已选 {{ selectedCount }} / {{ totalCount }}
                </NTag>
                <NButton size="tiny" @click="selectAll">
                  全选
                </NButton>
                <NButton size="tiny" @click="selectNone">
                  清空
                </NButton>
              </NSpace>
            </div>
            <NInput
              v-model:value="searchQuery"
              placeholder="搜索色号或色系..."
              clearable
              style="margin-bottom: 12px"
            />

            <div class="color-sections">
              <div
                v-for="[series, colors] in groupedColors"
                :key="series"
                class="color-section"
              >
                <div class="color-section-header">
                  <span class="color-section-title">{{ colors[0]?.seriesName ?? series }}</span>
                  <NSpace :size="4">
                    <NButton size="tiny" quaternary @click="selectSeries(series)">
                      全选
                    </NButton>
                    <NButton size="tiny" quaternary @click="deselectSeries(series)">
                      取消
                    </NButton>
                  </NSpace>
                </div>
                <div class="color-grid">
                  <div
                    v-for="color in colors"
                    :key="color.id"
                    class="color-swatch"
                    :class="{ selected: isSelected(color.id) }"
                    :style="{ background: color.hex }"
                    :title="color.id"
                    @click="onColorToggle(color.id, $event)"
                  >
                    <span
                      class="color-swatch-label"
                      :style="{ color: labelColor(color.hex) }"
                    >{{ color.id }}</span>
                    <span v-if="isSelected(color.id)" class="color-swatch-check">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <template #footer>
            <NSpace justify="end">
              <NButton v-if="editingId" @click="resetForm">
                取消编辑
              </NButton>
              <NButton type="primary" :disabled="selectedCount === 0 || !formName.trim()" @click="savePalette">
                {{ editingId ? '保存修改' : '创建色号库' }}
              </NButton>
            </NSpace>
          </template>
        </NCard>
      </section>
    </main>
  </div>
</template>

<style scoped>
.palettes-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f6f8;
  overflow-y: auto;
  overflow-x: hidden;
}

.palettes-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.palettes-header h1 {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
}

.palettes-main {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: minmax(0, 1fr);
  gap: 16px;
  flex: 1;
  min-height: 0;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
}

.palettes-list,
.palettes-editor {
  min-height: 0;
  overflow: hidden;
}

.palettes-list :deep(.n-card),
.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.palettes-list :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.editor-card :deep(.n-card-header) {
  flex-shrink: 0;
}

.editor-card :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.editor-card :deep(.n-card__footer) {
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .palettes-main {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .palettes-list {
    max-height: 240px;
  }
}

.palette-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.palette-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.palette-item:hover {
  border-color: #2080f0;
  background: #f8fbff;
}

.palette-item.active {
  border-color: #2080f0;
  background: #eef5ff;
}

.palette-item-name {
  font-weight: 600;
  font-size: 14px;
}

.palette-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.form-row {
  margin-bottom: 20px;
}

.form-row label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.form-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.form-row-header label {
  margin-bottom: 0;
}

.form-row--grow {
  margin-bottom: 0;
}

.color-sections {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}

.color-section + .color-section {
  margin-top: 16px;
}

.color-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.color-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.color-swatch {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, border-color 0.1s, opacity 0.1s;
  opacity: 0.45;
}

.color-swatch:hover {
  transform: scale(1.08);
  opacity: 0.75;
}

.color-swatch.selected {
  border-color: #2080f0;
  opacity: 1;
  box-shadow: 0 0 0 1px #2080f0;
}

.color-swatch-label {
  font-size: 10px;
  font-weight: 600;
  pointer-events: none;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.color-swatch-check {
  position: absolute;
  top: 2px;
  right: 3px;
  font-size: 11px;
  font-weight: 700;
  color: #2080f0;
  text-shadow: 0 0 2px #fff;
  pointer-events: none;
}
</style>
