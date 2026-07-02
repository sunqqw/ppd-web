export const GRID_SIZE_MIN = 10
export const GRID_SIZE_MAX = 200

function clampGridDimension(n: number): number {
  return Math.max(GRID_SIZE_MIN, Math.min(GRID_SIZE_MAX, Math.round(n)))
}

/**
 * 根据原图宽高比，在参考尺寸范围内计算目标网格尺寸（等比缩放，不拉伸）。
 */
export function calcGridSizePreservingAspectRatio(
  imageWidth: number,
  imageHeight: number,
  refWidth: number,
  refHeight: number,
): { width: number, height: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return {
      width: clampGridDimension(refWidth),
      height: clampGridDimension(refHeight),
    }
  }

  const aspect = imageWidth / imageHeight
  const refAspect = refWidth / refHeight

  let width: number
  let height: number

  if (aspect >= refAspect) {
    width = refWidth
    height = refWidth / aspect
  }
  else {
    height = refHeight
    width = refHeight * aspect
  }

  if (width > GRID_SIZE_MAX) {
    width = GRID_SIZE_MAX
    height = width / aspect
  }
  if (height > GRID_SIZE_MAX) {
    height = GRID_SIZE_MAX
    width = height * aspect
  }
  if (width < GRID_SIZE_MIN) {
    width = GRID_SIZE_MIN
    height = width / aspect
  }
  if (height < GRID_SIZE_MIN) {
    height = GRID_SIZE_MIN
    width = height * aspect
  }

  return {
    width: clampGridDimension(width),
    height: clampGridDimension(height),
  }
}
