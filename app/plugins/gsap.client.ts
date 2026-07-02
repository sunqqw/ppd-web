import { gsap } from 'gsap'

export default defineNuxtPlugin(() => {
  gsap.defaults({
    duration: 0.35,
    ease: 'power2.out',
  })
})
