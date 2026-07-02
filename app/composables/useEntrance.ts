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
      const root = document.querySelector('.workspace')
      if (root instanceof HTMLElement) {
        const { workspaceEntrance } = useGsapMotion()
        workspaceEntrance(root)
      }
    })
  }

  function playWorkspaceEntranceIfReady() {
    nextTick(() => {
      const root = document.querySelector('.workspace')
      if (root instanceof HTMLElement) {
        const { workspaceEntrance } = useGsapMotion()
        workspaceEntrance(root)
      }
    })
  }

  return {
    showEntrance,
    workspaceReady,
    checkEntrance,
    onEntranceComplete,
    playWorkspaceEntranceIfReady,
  }
}
