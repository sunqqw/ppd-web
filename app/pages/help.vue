<script setup lang="ts">
import { NCard, NUl, NLi, NButton } from 'naive-ui'

const pageRef = ref<HTMLElement | null>(null)
const { pageEnter } = useGsapMotion()

onMounted(() => {
  if (pageRef.value) pageEnter(pageRef.value)
})
</script>

<template>
  <div ref="pageRef" class="help-page">
    <header class="help-header page-header">
      <NuxtLink to="/">
        <NButton quaternary>
          ← 返回工作台
        </NButton>
      </NuxtLink>
      <h1>使用帮助</h1>
    </header>

    <main class="help-content page-main">
      <NCard title="快速开始">
        <NUl>
          <NLi>点击「导入图片」上传 JPG/PNG 图片，系统自动转为拼豆图纸</NLi>
          <NLi>在右侧选择色号库、调整图纸尺寸和转图参数</NLi>
          <NLi>使用左侧工具栏进行手动绘制和编辑</NLi>
          <NLi>完成后「导出图纸」打印使用，「导出采购清单」备料</NLi>
        </NUl>
      </NCard>

      <NCard title="转图流程" style="margin-top: 16px">
        <p class="pipeline">导入图片 → 背景移除 → 全图色号量化 → 描边优先降采样 → 外侧轮廓补全 → 填充色合并 → 可编辑 / 导出</p>
        <p class="note">图片仅在本机浏览器中处理，不会上传到服务器。</p>
      </NCard>

      <NCard title="核心算法" style="margin-top: 16px">
        <NUl>
          <NLi><strong>全图色号量化</strong>：先将每个源像素匹配到最近色号，消除抗锯齿中间色</NLi>
          <NLi><strong>描边优先降采样</strong>：分块统计时优先保留黑色描边，避免细线被粉色填充吞掉</NLi>
          <NLi><strong>外侧轮廓补全</strong>：贴靠外侧背景的填充格自动补为描边色，眼睛等内部镂空不受影响</NLi>
          <NLi><strong>填充色合并</strong>：仅合并填充色小区域，描边色不参与合并</NLi>
        </NUl>
      </NCard>

      <NCard title="转图参数建议" style="margin-top: 16px">
        <p class="note">边缘仍有灰色杂点时，可在右侧面板尝试以下调整：</p>
        <NUl>
          <NLi><strong>背景容差</strong>：调高至 35–45，更激进地移除浅色背景</NLi>
          <NLi><strong>最小区域</strong>：调高至 3–4，合并更多细小杂色块</NLi>
          <NLi><strong>相似度阈值</strong>：适当调高，加强相近颜色合并</NLi>
          <NLi><strong>精细度</strong>：适当调高，保留更多细节</NLi>
        </NUl>
      </NCard>

      <NCard title="色号库说明" style="margin-top: 16px">
        <NUl>
          <NLi>内置 MARD、Artkal、Perler、Hama 等主流品牌固定色号库，保证图纸配色标准化</NLi>
          <NLi>可在「色号库」页面创建自定义色号库，从品牌色号库中勾选你实际拥有的豆子颜色</NLi>
          <NLi>切换色号库后可通过「重新匹配色号库」一键全局换色</NLi>
        </NUl>
      </NCard>

      <NCard title="常见问题" style="margin-top: 16px">
        <NUl>
          <NLi>图片仅在本机处理，不会上传到服务器</NLi>
          <NLi>创作进度自动保存在浏览器本地，刷新页面可恢复</NLi>
          <NLi>图纸尺寸支持 10×10 至 200×200 格</NLi>
          <NLi>导出图纸默认 2× 倍率，适合 A4 纸打印</NLi>
        </NUl>
      </NCard>
    </main>
  </div>
</template>

<style scoped>
.help-page {
  min-height: 100vh;
  background: #f5f6f8;
  overflow-y: auto;
}

.help-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.help-header h1 {
  font-size: 20px;
  font-weight: 600;
}

.help-content {
  max-width: 720px;
  margin: 24px auto;
  padding: 0 16px 40px;
}

.pipeline {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.note {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

@media (max-width: 640px) {
  .help-page {
    min-height: var(--ws-viewport-h);
  }

  .help-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px;
  }

  .help-header h1 {
    flex-basis: 100%;
    font-size: 18px;
  }

  .help-content {
    margin: 14px auto;
    padding: 0 12px 28px;
  }

  .pipeline,
  .note {
    font-size: 13px;
  }
}
</style>
