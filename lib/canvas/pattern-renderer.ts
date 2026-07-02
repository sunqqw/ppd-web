import type { GridState } from '../types/grid'
import { gridIndex } from '../types/grid'

const EMPTY: [number, number, number] = [250, 250, 250]

export class PatternRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private imageData!: ImageData
  private hexCache = new Map<string, [number, number, number]>()
  private getHex: (colorId: string) => string
  private gridW: number
  private gridH: number

  constructor(gridW: number, gridH: number, getHex: (colorId: string) => string) {
    this.gridW = gridW
    this.gridH = gridH
    this.getHex = getHex
    this.canvas = document.createElement('canvas')
    this.initBuffer(gridW, gridH)
  }

  private initBuffer(w: number, h: number) {
    this.canvas.width = w
    this.canvas.height = h
    this.ctx = this.canvas.getContext('2d')!
    this.imageData = this.ctx.createImageData(w, h)
  }

  resize(gridW: number, gridH: number, getHex: (colorId: string) => string): boolean {
    this.getHex = getHex
    if (gridW === this.gridW && gridH === this.gridH) return false
    this.gridW = gridW
    this.gridH = gridH
    this.initBuffer(gridW, gridH)
    return true
  }

  private parseHex(hex: string): [number, number, number] {
    let cached = this.hexCache.get(hex)
    if (!cached) {
      cached = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
      ]
      this.hexCache.set(hex, cached)
    }
    return cached
  }

  private writePixel(x: number, y: number, colorId: string | null) {
    const i = (y * this.gridW + x) * 4
    const [r, g, b] = colorId ? this.parseHex(this.getHex(colorId)) : EMPTY
    this.imageData.data[i] = r
    this.imageData.data[i + 1] = g
    this.imageData.data[i + 2] = b
    this.imageData.data[i + 3] = 255
  }

  rebuildFromGrid(grid: GridState) {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const cell = grid.cells[gridIndex(x, y, grid.width)]
        this.writePixel(x, y, cell.colorId)
      }
    }
    this.flush()
  }

  updateCells(cells: { x: number, y: number, colorId: string | null }[]) {
    for (const { x, y, colorId } of cells) {
      if (x < 0 || y < 0 || x >= this.gridW || y >= this.gridH) continue
      this.writePixel(x, y, colorId)
    }
    this.flush()
  }

  private flush() {
    this.ctx.putImageData(this.imageData, 0, 0)
  }

  drawTo(ctx: CanvasRenderingContext2D, ox: number, oy: number, cellSize: number) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.canvas, ox, oy, this.gridW * cellSize, this.gridH * cellSize)
  }
}
