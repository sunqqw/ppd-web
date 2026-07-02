const ENTRANCE_KEY = 'ppd-entrance-seen-v1'

export function useEntrance() {
  const showEntrance = ref(true)
  const workspaceReady = ref(false)

  function checkEntrance() {
    if (typeof sessionStorage === 'undefined') {
      workspaceReady.value = true
      return
    }
    const seen = sessionStorage.getItem(ENTRANCE_KEY) === '1'
    showEntrance.value = !seen
    workspaceReady.value = seen
  }

  function onEntranceComplete() {
    showEntrance.value = false
    nextTick(() => {
      workspaceReady.value = true
      const { gsap } = useGSAP()
      gsap.from('.workspace', { autoAlpha: 0, duration: 0.45, ease: 'power2.out' })
    })
  }

  return {
    showEntrance,
    workspaceReady,
    checkEntrance,
    onEntranceComplete,
  }
}
