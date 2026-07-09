export type GestureMode = 'idle' | 'draw' | 'pan' | 'pinch'

export type GestureDispatch = 'none' | 'draw' | 'viewport'

export interface GesturePointer {
  id: number
  x: number
  y: number
}

export interface GestureTransform {
  scale: number
  offsetX: number
  offsetY: number
  cellPixelSize: number
}

export interface GestureConfig {
  panToolActive: boolean
  viewportLocked: boolean
  mobileViewport: boolean
}

export interface GestureCallbacks {
  getTransform: () => GestureTransform
  setTransform: (partial: Partial<GestureTransform>) => void
  onCancelDraw?: () => void
}

interface PanSession {
  anchorId: number
  startX: number
  startY: number
  baseOffsetX: number
  baseOffsetY: number
}

interface PinchSession {
  startDistance: number
  startScale: number
  lastMidX: number
  lastMidY: number
  baseOffsetX: number
  baseOffsetY: number
}

function pointerDistance(a: GesturePointer, b: GesturePointer) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function pointerMidpoint(a: GesturePointer, b: GesturePointer) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function clampScale(scale: number) {
  return Math.max(0.2, Math.min(5, scale))
}

function allowsViewport(config: GestureConfig) {
  return !config.viewportLocked || config.mobileViewport
}

function isDesktopPanTrigger(button: number, altKey: boolean) {
  return button === 1 || button === 2 || altKey
}

/**
 * 独立手势状态机：管理单指绘制、双指平移/缩放、平移工具与桌面平移。
 */
export class CanvasGestureController {
  private pointers = new Map<number, GesturePointer>()
  private mode: GestureMode = 'idle'
  private panSession: PanSession | null = null
  private pinchSession: PinchSession | null = null

  getMode() {
    return this.mode
  }

  isViewportActive() {
    return this.mode === 'pan' || this.mode === 'pinch'
  }

  private listPointers() {
    return [...this.pointers.values()]
  }

  private beginPan(pointer: GesturePointer, transform: GestureTransform) {
    this.mode = 'pan'
    this.pinchSession = null
    this.panSession = {
      anchorId: pointer.id,
      startX: pointer.x,
      startY: pointer.y,
      baseOffsetX: transform.offsetX,
      baseOffsetY: transform.offsetY,
    }
  }

  private beginPinch(
    a: GesturePointer,
    b: GesturePointer,
    transform: GestureTransform,
    callbacks: GestureCallbacks,
  ) {
    if (this.mode === 'draw') {
      callbacks.onCancelDraw?.()
    }

    const mid = pointerMidpoint(a, b)
    this.mode = 'pinch'
    this.panSession = null
    this.pinchSession = {
      startDistance: Math.max(pointerDistance(a, b), 1),
      startScale: transform.scale,
      lastMidX: mid.x,
      lastMidY: mid.y,
      baseOffsetX: transform.offsetX,
      baseOffsetY: transform.offsetY,
    }
  }

  private applyPanFromSession(pointer: GesturePointer, callbacks: GestureCallbacks) {
    if (!this.panSession) return
    callbacks.setTransform({
      offsetX: this.panSession.baseOffsetX + (pointer.x - this.panSession.startX),
      offsetY: this.panSession.baseOffsetY + (pointer.y - this.panSession.startY),
    })
  }

  private applyPinch(
    a: GesturePointer,
    b: GesturePointer,
    canvasRect: DOMRect,
    callbacks: GestureCallbacks,
  ) {
    if (!this.pinchSession) return

    const transform = callbacks.getTransform()
    const distance = Math.max(pointerDistance(a, b), 1)
    const mid = pointerMidpoint(a, b)
    const focalX = mid.x - canvasRect.left
    const focalY = mid.y - canvasRect.top

    const nextScale = clampScale(this.pinchSession.startScale * (distance / this.pinchSession.startDistance))
    const oldCellSize = transform.cellPixelSize * transform.scale
    const contentX = (focalX - transform.offsetX) / oldCellSize
    const contentY = (focalY - transform.offsetY) / oldCellSize
    const newCellSize = transform.cellPixelSize * nextScale

    const panDx = mid.x - this.pinchSession.lastMidX
    const panDy = mid.y - this.pinchSession.lastMidY

    callbacks.setTransform({
      scale: nextScale,
      offsetX: focalX - contentX * newCellSize + panDx,
      offsetY: focalY - contentY * newCellSize + panDy,
    })

    this.pinchSession.lastMidX = mid.x
    this.pinchSession.lastMidY = mid.y
  }

  onPointerDown(
    e: PointerEvent,
    config: GestureConfig,
    callbacks: GestureCallbacks,
  ): GestureDispatch {
    this.pointers.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY })

    const transform = callbacks.getTransform()
    const pointers = this.listPointers()

    if (pointers.length >= 2 && allowsViewport(config)) {
      this.beginPinch(pointers[0], pointers[1], transform, callbacks)
      return 'viewport'
    }

    if (allowsViewport(config) && (config.panToolActive || isDesktopPanTrigger(e.button, e.altKey))) {
      this.beginPan(pointers[0]!, transform)
      return 'viewport'
    }

    this.mode = 'draw'
    this.panSession = null
    this.pinchSession = null
    return 'draw'
  }

  onPointerMove(
    e: PointerEvent,
    canvasRect: DOMRect,
    config: GestureConfig,
    callbacks: GestureCallbacks,
  ): GestureDispatch {
    if (!this.pointers.has(e.pointerId)) return 'none'
    this.pointers.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY })

    const pointers = this.listPointers()

    if (this.mode === 'pinch' && pointers.length >= 2 && allowsViewport(config)) {
      this.applyPinch(pointers[0]!, pointers[1]!, canvasRect, callbacks)
      return 'viewport'
    }

    if (this.mode === 'pan' && this.panSession) {
      const anchor = this.pointers.get(this.panSession.anchorId) ?? pointers[0]
      if (anchor) this.applyPanFromSession(anchor, callbacks)
      return 'viewport'
    }

    if (this.mode === 'draw') return 'draw'
    return 'none'
  }

  onPointerUp(e: PointerEvent, config: GestureConfig, callbacks: GestureCallbacks): GestureDispatch {
    const wasViewport = this.isViewportActive()
    const wasDraw = this.mode === 'draw'
    this.pointers.delete(e.pointerId)

    const pointers = this.listPointers()
    const transform = callbacks.getTransform()

    if (pointers.length >= 2 && allowsViewport(config)) {
      this.beginPinch(pointers[0], pointers[1], transform, callbacks)
      return 'viewport'
    }

    if (pointers.length === 1 && wasViewport && this.mode === 'pinch') {
      if (config.panToolActive) {
        this.beginPan(pointers[0], transform)
        return 'viewport'
      }
      this.mode = 'idle'
      this.pinchSession = null
      this.panSession = null
      return 'none'
    }

    if (pointers.length === 0) {
      this.mode = 'idle'
      this.panSession = null
      this.pinchSession = null
      return wasViewport ? 'viewport' : (wasDraw ? 'draw' : 'none')
    }

    return wasViewport ? 'viewport' : 'none'
  }

  onPointerCancel(e: PointerEvent, config: GestureConfig, callbacks: GestureCallbacks): GestureDispatch {
    return this.onPointerUp(e, config, callbacks)
  }

  reset() {
    this.pointers.clear()
    this.mode = 'idle'
    this.panSession = null
    this.pinchSession = null
  }
}
