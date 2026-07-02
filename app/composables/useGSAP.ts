import { gsap } from 'gsap'

let registered = false

export function useGSAP() {
  if (!registered && import.meta.client) {
    registered = true
  }

  return { gsap }
}
