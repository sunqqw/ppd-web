export interface Rgb {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbDistanceSq(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

export function rgbDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt(rgbDistanceSq(a, b))
}

export function quantizeChannel(value: number, step: number): number {
  if (step <= 1) return value
  return Math.round(value / step) * step
}

export function quantizeRgb(rgb: Rgb, step: number): Rgb {
  return {
    r: quantizeChannel(rgb.r, step),
    g: quantizeChannel(rgb.g, step),
    b: quantizeChannel(rgb.b, step),
  }
}

export function rgbKey(r: number, g: number, b: number): string {
  return `${r},${g},${b}`
}

export function packRgb(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b
}

export function quantizeChannelInline(value: number, step: number): number {
  if (step <= 1) return value
  return Math.round(value / step) * step
}

export function toleranceToDistance(tolerance: number): number {
  return (tolerance / 100) * 441.67
}

export function toleranceToDistanceSq(tolerance: number): number {
  const d = toleranceToDistance(tolerance)
  return d * d
}

export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}
