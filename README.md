# 拼豆图纸生成器

免费在线拼豆图纸生成工具，基于 Nuxt 4.4 构建，纯前端本地运算。

## 功能

- **智能转图**：描边优先的拼豆转图管线，完整保留黑色轮廓与填充色
- **背景智能移除**：边界洪水填充，自动清除外部背景
- **填充色合并**：仅合并填充色小区域，描边色全程受保护
- **内置主流拼豆色号库**：MARD、Artkal、Perler、Hama 等
- **手绘编辑工具**：画笔 / 橡皮 / 填充 / 取色 / 框选，Bresenham 插值保证笔画连续
- **高性能画布**：离屏图案缓存 + 双层 Canvas 增量渲染，100×100 网格可流畅编辑
- **画布状态栏**：实时显示网格尺寸、缩放比例、豆子总数与当前色号
- **固定画布模式**：锁定缩放与平移，画布自动居中，专注绘制
- **快捷色号栏**：侧栏可折叠，支持 6 个常用色号槽位
- **导出可打印 PNG 图纸**：含色号标注和网格线
- **导出采购清单图**
- **本地草稿自动保存**
- **入场与工作区动效**：GSAP 驱动，尊重 `prefers-reduced-motion`

## 转图流程

```
导入图片 → 背景移除 → 全图色号量化 → 描边优先降采样 → 外侧轮廓补全 → 填充色合并 → 可编辑 / 导出
```

图片仅在本机浏览器中处理，不会上传到服务器。

详细算法说明见 **[转图算法技术文章](docs/转图算法.md)**。

## 画布渲染

笔刷绘制采用**读写分离 + 增量渲染 + 分层绘制**架构：

```
pointer 事件 → Bresenham 插值写格 → 离屏 PatternRenderer 增量更新 → rAF 节流输出
                ↘ 网格层独立叠加，仅在缩放/平移/开关切换时重绘
```

详细设计与性能分析见 **[画布渲染性能优化](画布渲染性能优化.md)**。

## 开发

```bash
# 安装依赖
pnpm install

# 迁移色号库（首次）
pnpm migrate-palettes

# 开发
pnpm dev

# 构建静态站点
pnpm generate
```

## 技术栈

- Nuxt 4.4 + Vue 3 + TypeScript
- Pinia 状态管理
- Naive UI 组件库
- Canvas API + Web Worker
- GSAP 动效

## 转图参数

| 参数 | 说明 | 建议 |
|------|------|------|
| 精细度 | 控制描边保留灵敏度，越高越易保留细线 | 细节多时可调高至 60–80 |
| 背景容差 | 背景洪水填充的颜色容差 | 浅色背景残留时调至 35–45 |
| 相似度阈值 | 填充色合并的 RGB 距离阈值 | 杂色多时可适当调高 |
| 最小区域 | 小于此格数的填充色区域会被合并 | 一般 2–4 |

## 项目结构

```
lib/image/                    # 转图管线
  pipeline.ts                 # 管线编排
  background-remove.ts        # 背景移除
  quantize.ts                 # 全图色号量化
  sample-grid.ts              # 描边优先降采样
  grid-outline.ts             # 外侧轮廓补全
  grid-refine.ts              # 填充色合并与杂点清理
  color-role.ts               # 颜色角色分类

lib/canvas/                   # 画布渲染
  pattern-renderer.ts         # 离屏图案缓存，增量/全量更新
  grid-overlay.ts             # 网格线、选区框绘制
  color-labels.ts             # 色号标注绘制

lib/grid/
  line-draw.ts                # Bresenham 插值、笔刷区域计算

app/composables/
  useCanvasRenderer.ts        # 工具层与渲染层回调桥接
  useGsapMotion.ts            # 工作区/页面入场与交互动效

workers/image-worker.ts       # 图片转图 Web Worker 入口
```
