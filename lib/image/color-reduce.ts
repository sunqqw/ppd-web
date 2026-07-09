/**
 * 用色上限缩减模块（maxColors）
 *
 * 职责：在转图管线末端，将网格中的色号种类压缩到不超过用户设定的上限 N。
 *
 * 与 mergeFillRegions 的区别：
 * - mergeFillRegions：基于 BFS 连通区域，仅合并「填充色」小区域，优化空间连贯性
 * - reduceToMaxColors：全局色号维度聚合，描边/填充/背景一律计入，控制种类上限
 *
 * 算法：贪心聚合合并 — 每轮合并「代价最小」的色号（用量少且易替代者优先）
 *
 * @see docs/superpowers/specs/2026-07-09-max-colors-design.md §5
 */

import type { GridState } from '../types/grid'
import type { PaletteMatcher } from '../color/palette-matcher'
import { rgbDistance, rgbDistanceSq } from '../color/rgb'

/** 默认开启上限时的色号数量 */
export const DEFAULT_MAX_COLORS = 15

/** 用户可设定的色号上限最小值 */
export const MIN_MAX_COLORS = 2

/** 用户可设定的色号上限最大值 */
export const MAX_MAX_COLORS = 50

/**
 * 统计当前网格中各色号的使用频次。
 * 透明格（colorId === null）不参与统计。
 */
export function countColorUsage(grid: GridState): Map<string, number> {
  const usage = new Map<string, number>()
  for (const cell of grid.cells) {
    if (!cell.colorId) continue
    usage.set(cell.colorId, (usage.get(cell.colorId) ?? 0) + 1)
  }
  return usage
}

/**
 * 在 usedColors 集合中，找与 sourceId RGB 欧氏距离最近的色号（不含 sourceId 自身）。
 *
 * @param sourceId - 待合并的「受害」色号
 * @param usedColors - 当前仍在使用的色号集合
 * @param matcher - 色号 RGB 查询
 * @returns 最近邻色号 ID；若集合中无其他色号则返回 sourceId
 */
export function findNearestUsedColor(
  sourceId: string,
  usedColors: Set<string>,
  matcher: PaletteMatcher,
): string {
  const sourceRgb = matcher.getRgb(sourceId)
  let bestId = sourceId
  let bestDistSq = Infinity

  for (const otherId of usedColors) {
    if (otherId === sourceId) continue
    const distSq = rgbDistanceSq(sourceRgb, matcher.getRgb(otherId))
    // 距离相同时取字典序较小的 colorId，保证结果确定性
    if (distSq < bestDistSq || (distSq === bestDistSq && otherId < bestId)) {
      bestDistSq = distSq
      bestId = otherId
    }
  }

  return bestId
}

/**
 * 计算将 colorId 合并到最近邻色的代价。
 *
 * 公式：cost = pixelCount(colorId) × minRgbDistance(colorId, otherUsedColors)
 *
 * 像素越少、与邻色越接近的颜色，代价越低，越优先被合并掉。
 */
export function mergeCost(
  colorId: string,
  usage: Map<string, number>,
  usedColors: Set<string>,
  matcher: PaletteMatcher,
): number {
  const pixelCount = usage.get(colorId) ?? 0
  if (pixelCount === 0) return 0

  const sourceRgb = matcher.getRgb(colorId)
  let minDist = Infinity

  for (const otherId of usedColors) {
    if (otherId === colorId) continue
    const dist = rgbDistance(sourceRgb, matcher.getRgb(otherId))
    if (dist < minDist) minDist = dist
  }

  // 仅有一种颜色时不会发生合并，此处防御性返回无穷大
  if (minDist === Infinity) return Infinity

  return pixelCount * minDist
}

/**
 * 将网格用色种类压缩到不超过 maxColors（原地修改 grid）。
 *
 * @param grid - 拼豆网格，函数结束后满足 uniqueColorIds ≤ maxColors
 * @param matcher - 色号 RGB 查询，用于计算合并距离
 * @param maxColors - 用色上限，须 ≥ 2
 *
 * 边界行为：
 * - 当前种类已 ≤ maxColors：直接返回，不修改网格
 * - 全透明网格：直接返回
 * - 透明格始终不参与统计与重映射
 */
export function reduceToMaxColors(
  grid: GridState,
  matcher: PaletteMatcher,
  maxColors: number,
): void {
  // 步骤 1：统计各色号频次
  const usage = countColorUsage(grid)
  const usedColors = new Set(usage.keys())

  // 已满足上限或无可合并颜色，无需操作
  if (usedColors.size <= maxColors) return

  // 步骤 2：贪心循环，每轮合并一种颜色，直到种类 ≤ maxColors
  while (usedColors.size > maxColors) {
    // 步骤 2a：找出合并代价最小的「受害」色号
    let victimId = ''
    let victimCost = Infinity

    for (const colorId of usedColors) {
      const cost = mergeCost(colorId, usage, usedColors, matcher)
      // 代价相同时取 colorId 字典序较小者，保证同输入同输出
      if (cost < victimCost || (cost === victimCost && colorId < victimId)) {
        victimCost = cost
        victimId = colorId
      }
    }

    if (!victimId) break

    // 步骤 2b：确定合并目标（RGB 最近的已有色号）
    const targetId = findNearestUsedColor(victimId, usedColors, matcher)

    // 步骤 2c：将网格中所有 victim 格子重映射为 target
    for (const cell of grid.cells) {
      if (cell.colorId === victimId) {
        cell.colorId = targetId
      }
    }

    // 步骤 2d：更新频次表与在用色号集合
    usage.set(targetId, (usage.get(targetId) ?? 0) + (usage.get(victimId) ?? 0))
    usage.delete(victimId)
    usedColors.delete(victimId)
  }
}
