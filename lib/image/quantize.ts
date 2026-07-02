import type { PaletteMatcher } from '../color/palette-matcher'

export interface QuantizedImage {
  width: number
  height: number
  /** 每像素对应色号，透明像素为空字符串 */
  colorIds: string[]
}

export function quantizeImage(imageData: ImageData, matcher: PaletteMatcher): QuantizedImage {
  const { width, height, data } = imageData
  const colorIds = new Array<string>(width * height)

  for (let i = 0; i < width * height; i++) {
    const di = i * 4
    if (data[di + 3] < 128) {
      colorIds[i] = ''
      continue
    }
    colorIds[i] = matcher.findNearest(data[di], data[di + 1], data[di + 2])
  }

  return { width, height, colorIds }
}
