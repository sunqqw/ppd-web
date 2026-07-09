# 图纸四边数字坐标 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在编辑画布与导出图纸的网格四边绘制 1-based 行列数字坐标，可开关且默认开启。

**Architecture:** 新建共享 `drawCoordinateLabels`；编辑侧在 Grid 层按 `showCoordinates` 绘制；导出侧扩展 `DrawingExportOptions`、预留坐标带并绘制。网格开关与坐标开关相互独立。

**Tech Stack:** Nuxt 4、Vue 3、TypeScript、Canvas 2D、Pinia、Naive UI

**Spec:** `docs/superpowers/specs/2026-07-09-coordinate-labels-design.md`

---

## File structure

| 文件 | 职责 |
|------|------|
| `lib/canvas/coordinate-labels.ts` | **新建**四边坐标绘制 |
| `app/stores/settings.ts` | `showCoordinates` 默认 true + toggle |
| `app/components/canvas/CanvasEditor.vue` | Grid 层接入（与网格线解耦） |
| `app/components/layout/ToolBar.vue` | 视图区坐标开关 |
| `lib/types/export.ts` | 导出选项字段 |
| `lib/export/drawing-export.ts` | 导出留白 + 绘制 |
| `app/components/export/ExportDrawingDialog.vue` | 勾选框 |

本仓库无单元测试框架；各 Task 以手动验收步骤代替自动化测试。用户规则：改完代码不做编译检查。

---

### Task 1: 共享绘制函数

**Files:**
- Create: `lib/canvas/coordinate-labels.ts`

- [ ] **Step 1: 新建文件并实现 `drawCoordinateLabels`**

```typescript
/**
 * 在网格四边外侧绘制 1-based 行列坐标。
 * - 上/下：列号 1…gridW，对齐每列中心
 * - 左/右：行号 1…gridH，对齐每行中心
 * ox/oy 为网格左上角；cellSize 为单格像素边长。
 */
export function drawCoordinateLabels(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  ox: number,
  oy: number,
  cellSize: number,
  scale: number = 1,
): void {
  if (gridW <= 0 || gridH <= 0 || cellSize <= 0) return

  const fontSize = Math.min(cellSize * 0.45, 11 * scale)
  const margin = cellSize * 0.55
  const gridPixelW = gridW * cellSize
  const gridPixelH = gridH * cellSize

  ctx.save()
  ctx.fillStyle = '#666'
  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let x = 0; x < gridW; x++) {
    const label = String(x + 1)
    const cx = ox + (x + 0.5) * cellSize
    ctx.fillText(label, cx, oy - margin)
    ctx.fillText(label, cx, oy + gridPixelH + margin)
  }

  for (let y = 0; y < gridH; y++) {
    const label = String(y + 1)
    const cy = oy + (y + 0.5) * cellSize
    ctx.fillText(label, ox - margin, cy)
    ctx.fillText(label, ox + gridPixelW + margin, cy)
  }

  ctx.restore()
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/canvas/coordinate-labels.ts
git commit -m "$(cat <<'EOF'
feat(canvas): 新增四边坐标绘制函数

EOF
)"
```

---

### Task 2: Settings 默认值与 toggle

**Files:**
- Modify: `app/stores/settings.ts`

- [ ] **Step 1: 将 `showCoordinates` 默认改为 `true`**

在 `state` 中：

```typescript
showCoordinates: true,
```

（原为 `false`）

- [ ] **Step 2: 在 `actions` 中、`toggleColorLabels` 之后增加**

```typescript
toggleCoordinates() {
  this.showCoordinates = !this.showCoordinates
},
```

- [ ] **Step 3: Commit**

```bash
git add app/stores/settings.ts
git commit -m "$(cat <<'EOF'
feat(settings): 坐标标注默认开启并支持切换

EOF
)"
```

---

### Task 3: 编辑画布 Grid 层接入

**Files:**
- Modify: `app/components/canvas/CanvasEditor.vue`
- Modify: `lib/canvas/grid-overlay.ts`

- [ ] **Step 1: 增加 import**

在现有 grid-overlay import 旁增加：

```typescript
import { drawCoordinateLabels } from '../../../lib/canvas/coordinate-labels'
```

- [ ] **Step 2: 修改 `lib/canvas/grid-overlay.ts` 的 `drawGridOverlay`，去掉内部 `clearRect`，并删除未再需要的 `canvasW`/`canvasH` 参数**

```typescript
export function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  ox: number,
  oy: number,
  cellSize: number,
) {
  ctx.strokeStyle = '#dddddd'
  ctx.lineWidth = 1

  for (let x = 0; x <= gridW; x++) {
    const px = ox + x * cellSize + 0.5
    ctx.beginPath()
    ctx.moveTo(px, oy)
    ctx.lineTo(px, oy + gridH * cellSize)
    ctx.stroke()
  }

  for (let y = 0; y <= gridH; y++) {
    const py = oy + y * cellSize + 0.5
    ctx.beginPath()
    ctx.moveTo(ox, py)
    ctx.lineTo(ox + gridW * cellSize, py)
    ctx.stroke()
  }
}
```

- [ ] **Step 3: 重写 `drawGrid`，使网格与坐标开关独立**

```typescript
function drawGrid() {
  const canvas = gridCanvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const { grid, transform } = canvasStore
  const cellSize = transform.cellPixelSize * transform.scale
  const cw = container.clientWidth
  const ch = container.clientHeight

  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw
    canvas.height = ch
  }

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, cw, ch)

  if (settingsStore.showGrid) {
    drawGridOverlay(
      ctx,
      grid.width,
      grid.height,
      transform.offsetX,
      transform.offsetY,
      cellSize,
    )
  }

  if (settingsStore.showCoordinates) {
    drawCoordinateLabels(
      ctx,
      grid.width,
      grid.height,
      transform.offsetX,
      transform.offsetY,
      cellSize,
      1,
    )
  }
}
```

- [ ] **Step 4: watch 依赖加入 `showCoordinates`**

在现有 transform/showGrid watch 数组中加入：

```typescript
settingsStore.showCoordinates,
```

- [ ] **Step 5: 手动验收**

1. `pnpm dev`，打开有图案的画布
2. 默认应看到四边 1-based 数字
3. 关闭网格、保持坐标开 → 仅数字、无线
4. 关闭坐标 → 数字消失
5. 缩放/平移 → 数字与格子对齐

- [ ] **Step 6: Commit**

```bash
git add lib/canvas/grid-overlay.ts app/components/canvas/CanvasEditor.vue
git commit -m "$(cat <<'EOF'
feat(canvas): 编辑画布四边显示行列坐标

EOF
)"
```

---

### Task 4: 工具栏开关

**Files:**
- Modify: `app/components/layout/ToolBar.vue`

- [ ] **Step 1: 在网格按钮后、色号按钮前插入坐标按钮**

```vue
      <button
        class="tool-btn"
        :class="{ active: settingsStore.showCoordinates }"
        title="显示坐标"
        @click="settingsStore.toggleCoordinates()"
        @mousedown="onPress"
        @mouseup="onRelease"
        @mouseleave="onRelease"
      >
        <span class="tool-label-icon">123</span>
      </button>
```

- [ ] **Step 2: 手动验收**

点击按钮可切换坐标显示，`active` 状态与显示一致。

- [ ] **Step 3: Commit**

```bash
git add app/components/layout/ToolBar.vue
git commit -m "$(cat <<'EOF'
feat(toolbar): 增加坐标标注开关

EOF
)"
```

---

### Task 5: 导出选项类型

**Files:**
- Modify: `lib/types/export.ts`

- [ ] **Step 1: 扩展接口与默认值**

```typescript
export interface DrawingExportOptions {
  showGrid: boolean
  showColorLabels: boolean
  showSizeLabel: boolean
  showLegend: boolean
  showCoordinates: boolean
  scale: 1 | 2 | 4
  format: 'png' | 'jpeg'
}

export const DEFAULT_DRAWING_EXPORT: DrawingExportOptions = {
  showGrid: true,
  showColorLabels: true,
  showSizeLabel: true,
  showLegend: true,
  showCoordinates: true,
  scale: 2,
  format: 'png',
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types/export.ts
git commit -m "$(cat <<'EOF'
feat(export): 图纸导出选项增加 showCoordinates

EOF
)"
```

---

### Task 6: 导出绘制与留白

**Files:**
- Modify: `lib/export/drawing-export.ts`

- [ ] **Step 1: 增加 import**

```typescript
import { drawCoordinateLabels } from '../canvas/coordinate-labels'
```

- [ ] **Step 2: 重写 `exportDrawing` 的尺寸与绘制起点逻辑**

将函数主体替换为（保留 `computeLegendHeight` / `drawLegend` / `downloadBlob` 不变）：

```typescript
export async function exportDrawing(
  grid: GridState,
  matcher: PaletteMatcher,
  options: DrawingExportOptions,
): Promise<Blob> {
  const cellSize = 20 * options.scale
  const padding = 40 * options.scale
  const legendHeight = options.showLegend ? computeLegendHeight(grid, matcher, options.scale) : 0
  const labelHeight = options.showSizeLabel ? 30 * options.scale : 0
  const coordBand = options.showCoordinates
    ? Math.max(14 * options.scale, cellSize * 0.7)
    : 0

  const canvasW = grid.width * cellSize + padding * 2 + coordBand * 2
  const canvasH = grid.height * cellSize + padding * 2 + labelHeight + legendHeight + coordBand * 2

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  if (options.showSizeLabel) {
    ctx.fillStyle = '#333'
    ctx.font = `${14 * options.scale}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${grid.width}×${grid.height}`, canvasW / 2, padding + 20 * options.scale)
  }

  const offsetX = padding + coordBand
  const offsetY = padding + labelHeight + coordBand

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.cells[gridIndex(x, y, grid.width)]
      const px = offsetX + x * cellSize
      const py = offsetY + y * cellSize

      if (cell.colorId) {
        ctx.fillStyle = matcher.getHex(cell.colorId)
        ctx.fillRect(px, py, cellSize, cellSize)
      }

      if (options.showGrid) {
        ctx.strokeStyle = '#cccccc'
        ctx.lineWidth = 1
        ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1)
      }
    }
  }

  if (options.showColorLabels) {
    drawColorLabels(ctx, grid, id => matcher.getHex(id), offsetX, offsetY, cellSize, options.scale, 'cell')
  }

  if (options.showCoordinates) {
    drawCoordinateLabels(ctx, grid.width, grid.height, offsetX, offsetY, cellSize, options.scale)
  }

  if (options.showLegend) {
    drawLegend(
      ctx,
      grid,
      matcher,
      padding,
      offsetY + grid.height * cellSize + coordBand + 20 * options.scale,
      options.scale,
    )
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('导出失败')),
      options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
      0.95,
    )
  })
}
```

- [ ] **Step 3: 手动验收**

打开导出对话框预览：默认四边有数字；取消「显示坐标」后数字消失；数字不裁切、不压色块。

- [ ] **Step 4: Commit**

```bash
git add lib/export/drawing-export.ts
git commit -m "$(cat <<'EOF'
feat(export): 导出图纸绘制四边坐标并预留边距

EOF
)"
```

---

### Task 7: 导出对话框勾选

**Files:**
- Modify: `app/components/export/ExportDrawingDialog.vue`

- [ ] **Step 1: 在「显示色号图例」勾选后增加**

```vue
        <NCheckbox v-model:checked="options.showCoordinates">
          显示坐标
        </NCheckbox>
```

（`options` 已从 `DEFAULT_DRAWING_EXPORT` 展开，含新字段即可。）

- [ ] **Step 2: 手动验收**

1. 打开导出图纸对话框，「显示坐标」默认勾选，预览有四边数字
2. 取消勾选，预览更新后无坐标
3. 导出 PNG 打开确认四边数字完整

- [ ] **Step 3: Commit**

```bash
git add app/components/export/ExportDrawingDialog.vue
git commit -m "$(cat <<'EOF'
feat(export): 导出对话框增加显示坐标选项

EOF
)"
```

---

## Spec coverage checklist

| Spec 要求 | Task |
|-----------|------|
| 共享 `drawCoordinateLabels` | Task 1 |
| 1-based、四边、每格都标、样式 | Task 1 |
| `showCoordinates` 默认 true + toggle | Task 2 |
| 编辑画布 Grid 层绘制 | Task 3 |
| 网格与坐标开关独立 | Task 3 |
| 工具栏开关 | Task 4 |
| 导出选项类型 | Task 5 |
| 导出留白 + 绘制 | Task 6 |
| 导出对话框勾选 | Task 7 |
| 非目标（抽稀/sticky/采购清单） | 不实现 |

---

## 总验收

1. 编辑画布默认四边 1…W / 1…H
2. 工具栏可关/开坐标；与网格开关独立
3. 缩放平移后对齐
4. 导出默认有坐标；取消勾选后无；数字不被裁切
