import { useCanvasStore } from '~/stores/canvas'
import { useSettingsStore } from '~/stores/settings'
import {
  CanvasGestureController,
  type GestureDispatch,
} from '../../lib/canvas/canvas-gestures'

const MOBILE_MEDIA = '(max-width: 700px), (pointer: coarse)'

export function useCanvasGestures(options: {
  onDrawCancel?: () => void
}) {
  const canvasStore = useCanvasStore()
  const settingsStore = useSettingsStore()
  const controller = new CanvasGestureController()

  const isMobileViewport = ref(false)
  const isViewportGesture = ref(false)

  function updateMobileViewport() {
    if (typeof window === 'undefined') return
    isMobileViewport.value = window.matchMedia(MOBILE_MEDIA).matches
  }

  const callbacks = {
    getTransform: () => ({ ...canvasStore.transform }),
    setTransform: (partial: Partial<typeof canvasStore.transform>) => {
      canvasStore.setTransform(partial)
    },
    onCancelDraw: () => {
      options.onDrawCancel?.()
    },
  }

  function gestureConfig() {
    return {
      panToolActive: settingsStore.tool === 'pan',
      viewportLocked: settingsStore.canvasFixed,
      mobileViewport: isMobileViewport.value,
    }
  }

  function handlePointerDown(e: PointerEvent, canvasEl: HTMLCanvasElement): GestureDispatch {
    canvasEl.setPointerCapture(e.pointerId)
    const dispatch = controller.onPointerDown(e, gestureConfig(), callbacks)
    isViewportGesture.value = controller.isViewportActive()
    settingsStore.isPanning = isViewportGesture.value
    return dispatch
  }

  function handlePointerMove(e: PointerEvent, canvasEl: HTMLCanvasElement): GestureDispatch {
    const rect = canvasEl.getBoundingClientRect()
    const dispatch = controller.onPointerMove(e, rect, gestureConfig(), callbacks)
    isViewportGesture.value = controller.isViewportActive()
    settingsStore.isPanning = isViewportGesture.value
    return dispatch
  }

  function handlePointerUp(e: PointerEvent): GestureDispatch {
    const dispatch = controller.onPointerUp(e, gestureConfig(), callbacks)
    isViewportGesture.value = controller.isViewportActive()
    settingsStore.isPanning = isViewportGesture.value
    return dispatch
  }

  function handlePointerCancel(e: PointerEvent): GestureDispatch {
    const dispatch = controller.onPointerCancel(e, gestureConfig(), callbacks)
    isViewportGesture.value = controller.isViewportActive()
    settingsStore.isPanning = isViewportGesture.value
    return dispatch
  }

  onMounted(() => {
    updateMobileViewport()
    window.addEventListener('resize', updateMobileViewport)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateMobileViewport)
    controller.reset()
    settingsStore.isPanning = false
  })

  return {
    isMobileViewport,
    isViewportGesture,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  }
}
