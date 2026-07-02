<script setup lang="ts">
import {
  NModal,
  NInput,
  NButton,
  NSpace,
  NDataTable,
  type DataTableColumns,
} from 'naive-ui'
import type { BomItem } from '../../../lib/types/export'
import { useExport } from '~/composables/useExport'
import { useCanvasStore } from '~/stores/canvas'

const show = defineModel<boolean>('show', { default: false })

const title = ref('拼豆采购清单')
const exporting = ref(false)
const { exportBomImage, getBomItems } = useExport()
const canvasStore = useCanvasStore()

const items = computed(() => getBomItems())

const columns: DataTableColumns<BomItem> = [
  {
    title: '色块',
    key: 'hex',
    width: 50,
    render: row => h('div', {
      style: {
        width: '24px',
        height: '24px',
        background: row.hex,
        border: '1px solid #ddd',
        borderRadius: '4px',
      },
    }),
  },
  { title: '色号', key: 'colorId', width: 80 },
  { title: '数量', key: 'count', width: 80, render: row => `${row.count} 颗` },
  { title: '占比', key: 'percentage', width: 80, render: row => `${row.percentage}%` },
]

async function onExport() {
  exporting.value = true
  try {
    await exportBomImage({ title: title.value })
    show.value = false
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <NModal v-model:show="show" preset="card" title="导出采购清单" style="width: 520px">
    <NSpace vertical :size="12">
      <div>
        <div style="font-size: 13px; margin-bottom: 6px; color: #666">
          项目名称
        </div>
        <NInput v-model:value="title" size="small" placeholder="拼豆采购清单" />
      </div>

      <div style="font-size: 13px; color: #666">
        图纸 {{ canvasStore.grid.width }}×{{ canvasStore.grid.height }}，
        共 {{ canvasStore.totalBeads }} 颗，
        {{ items.length }} 种颜色
      </div>

      <NDataTable
        :columns="columns"
        :data="items"
        :max-height="300"
        size="small"
      />
    </NSpace>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="show = false">
          取消
        </NButton>
        <NButton type="primary" :loading="exporting" @click="onExport">
          下载清单图
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
