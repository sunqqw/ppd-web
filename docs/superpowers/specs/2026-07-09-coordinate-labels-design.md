# 图纸四边数字坐标功能设计

> 版本：v1.0 | 日期：2026-07-09 | 状态：已评审待实现

---

## 1. 背景与目标

### 1.1 问题

拼豆图纸在对照实物拼装时，需要快速定位「第几行第几列」。当前编辑画布与导出 PNG 均只有网格线与色号，没有行列坐标，对照大图时容易数错格。

### 1.2 目标

在**编辑画布**与**导出图纸**两侧，于网格四个侧面绘制 1-based 数字坐标（上/下列号、左/右行号），并支持开关（默认开启）。

### 1.3 非目标（本版本不做）

- 不做按间距抽稀或自适应省略（每格都标）
- 不做 sticky / 固定在视口边缘的 DOM 标尺
- 不改内部网格坐标体系（内部仍为 0-based；仅展示层用 1-based）
- 不在采购清单导出中加坐标

---

## 2. 需求决策记录

| 决策项 | 结论 |
|--------|------|
| 作用范围 | 编辑画布 + 导出图纸（两边都要） |
| 编号起点 | **从 1 开始**（上/下：1…W，左/右：1…H） |
| 标注密度 | **每格都标**，不抽稀 |
| 开关 | **可开关，默认开** |
| 实现方案 | **共享 Canvas 绘制函数**（编辑 Grid 层与导出共用） |

---

## 3. 视觉与布局

### 3.1 位置

```
        1  2  3  …  W
      ┌──────────────┐
    1 │              │ 1
    2 │    网格区     │ 2
    … │              │ …
    H │              │ H
      └──────────────┘
        1  2  3  …  W
```

- 上、下边：列号，水平居中对齐每列中心
- 左、右边：行号，垂直居中对齐每行中心
- 文字画在网格**外侧**，不压住色块

### 3.2 样式

| 属性 | 值 |
|------|-----|
| 字号 | `min(cellSize * 0.45, 11 * scale)` |
| 颜色 | `#666` |
| 外侧边距 | 约 `cellSize * 0.55`（文字中心到网格边的距离） |
| 对齐 | `textAlign = 'center'`，`textBaseline = 'middle'` |

格子很小时字会挤/重叠，按产品决策接受，本版本不抽稀。

---

## 4. 共享绘制 API

新建 `lib/canvas/coordinate-labels.ts`：

```typescript
/**
 * 在网格四边外侧绘制 1-based 行列坐标。
 * ox/oy 为网格左上角屏幕坐标；cellSize 为单格像素边长。
 */
export function drawCoordinateLabels(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  ox: number,
  oy: number,
  cellSize: number,
  scale?: number,
): void
```

行为要点：

1. 列号：`label = x + 1`，位置 `(ox + (x + 0.5) * cellSize, oy - margin)` 与 `(…, oy + gridH * cellSize + margin)`
2. 行号：`label = y + 1`，位置 `(ox - margin, oy + (y + 0.5) * cellSize)` 与 `(ox + gridW * cellSize + margin, …)`
3. `scale` 默认 `1`，导出时传入 `options.scale`

---

## 5. 编辑画布接入

### 5.1 设置

`app/stores/settings.ts`：

- `showCoordinates` 默认值改为 `true`（当前为 `false` 且未接线）
- 新增 `toggleCoordinates()` action

### 5.2 渲染

`CanvasEditor.vue` 的 `drawGrid()`：

- 在 `drawGridOverlay` 之后（或网格关闭时仍可单独画坐标）：若 `showCoordinates`，调用 `drawCoordinateLabels`
- 坐标与网格线同属 Grid 层，随 `transform`（缩放/平移）一起重绘
- `watch` 依赖加入 `settingsStore.showCoordinates`

说明：网格线关闭时，坐标仍可独立显示（开关互不绑定）。

### 5.3 工具栏

`ToolBar.vue`「视图」区，在网格按钮旁增加坐标开关按钮：

- `active` 绑定 `showCoordinates`
- `title`：`显示坐标`
- 点击调用 `toggleCoordinates()`
- 图标可用简洁文字如 `123`（与现有 `#`、`A1` 风格一致）

---

## 6. 导出图纸接入

### 6.1 选项类型

`lib/types/export.ts`：

```typescript
interface DrawingExportOptions {
  // …
  showCoordinates: boolean
}

DEFAULT_DRAWING_EXPORT.showCoordinates = true
```

### 6.2 导出布局

`lib/export/drawing-export.ts`：

- 当 `showCoordinates` 为 true 时，四边额外预留坐标带：
  `coordBand = Math.max(14 * options.scale, cellSize * 0.7)`
- 网格左上角起点：
  - `offsetX = padding + (showCoordinates ? coordBand : 0)`
  - `offsetY = padding + labelHeight + (showCoordinates ? coordBand : 0)`
  画布宽高相应加上左右/上下各一条 `coordBand`（若开启）
- 尺寸标注（`showSizeLabel`）画在最顶部居中（`y ≈ padding + 20 * scale`），其上侧列号画在尺寸行下方、网格顶边之上的坐标带内，二者分区，不重叠
- 调用 `drawCoordinateLabels(ctx, width, height, offsetX, offsetY, cellSize, options.scale)`

### 6.3 导出对话框

`ExportDrawingDialog.vue` 增加勾选：

- 文案：`显示坐标`
- `v-model` 绑定 `options.showCoordinates`

---

## 7. 改动文件清单

| 文件 | 改动 |
|------|------|
| `lib/canvas/coordinate-labels.ts` | **新建**共享绘制函数 |
| `app/stores/settings.ts` | 默认 `true` + `toggleCoordinates` |
| `app/components/canvas/CanvasEditor.vue` | Grid 层绘制 + watch |
| `app/components/layout/ToolBar.vue` | 坐标开关按钮 |
| `lib/types/export.ts` | 选项字段与默认值 |
| `lib/export/drawing-export.ts` | 留白 + 绘制 |
| `app/components/export/ExportDrawingDialog.vue` | 勾选框 |

---

## 8. 验收标准

1. 编辑画布默认显示四边 1…W / 1…H 数字；工具栏可关闭/开启
2. 缩放、平移后坐标与格子对齐
3. 导出 PNG 勾选「显示坐标」时四边有对应数字；取消勾选则无
4. 导出默认勾选坐标；数字不与色块重叠，不被画布裁切
5. 网格开关与坐标开关相互独立

---

## 9. 风险与取舍

| 风险 | 处理 |
|------|------|
| 大图 + 小 cell 时数字重叠 | 产品接受；本版不抽稀 |
| 导出顶部尺寸标注与列号抢空间 | 坐标带与 size label 分区留白 |
| 固定画布模式下边缘数字可能贴视口边 | 与现有网格一致，依赖居中与 padding；不单独做 sticky |
