import type { TweenVars } from 'gsap'

const SIDE_PANEL_WIDTH = 288
const SIDE_PANEL_COLLAPSED = 56

export function prefersReducedMotion(): boolean {
  if (!import.meta.client) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useGsapMotion() {
  const { gsap } = useGSAP()

  function staggerIn(
    container: HTMLElement,
    selector: string,
    vars?: TweenVars,
  ) {
    const els = container.querySelectorAll(selector)
    if (!els.length) return

    if (prefersReducedMotion()) {
      gsap.set(els, { autoAlpha: 1, clearProps: 'transform' })
      return
    }

    gsap.from(els, {
      y: 16,
      autoAlpha: 0,
      duration: 0.45,
      stagger: 0.06,
      ease: 'power3.out',
      ...vars,
    })
  }

  function workspaceEntrance(root: HTMLElement) {
    const header = root.querySelector('.app-header')
    const toolbar = root.querySelector('.toolbar')
    const canvas = root.querySelector('.canvas-area')
    const side = root.querySelector('.side-panel')
    const targets = [header, toolbar, canvas, side].filter(Boolean)

    if (!targets.length) return

    if (prefersReducedMotion()) {
      gsap.set(targets, { autoAlpha: 1, clearProps: 'transform' })
      return
    }

    gsap.set(targets, { autoAlpha: 0 })
    if (header) gsap.set(header, { y: -20 })
    if (toolbar) gsap.set(toolbar, { x: -24 })
    if (side) gsap.set(side, { x: 24 })
    if (canvas) gsap.set(canvas, { scale: 0.98 })

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    if (header) tl.to(header, { y: 0, autoAlpha: 1, duration: 0.5 })
    if (toolbar) tl.to(toolbar, { x: 0, autoAlpha: 1, duration: 0.45 }, 0.1)
    if (canvas) tl.to(canvas, { scale: 1, autoAlpha: 1, duration: 0.55 }, 0.15)
    if (side) tl.to(side, { x: 0, autoAlpha: 1, duration: 0.45 }, 0.2)
  }

  function pageEnter(container: HTMLElement) {
    const header = container.querySelector('.page-header')
    const main = container.querySelector('.page-main')

    if (prefersReducedMotion()) {
      if (header) gsap.set(header, { autoAlpha: 1, clearProps: 'transform' })
      if (main) gsap.set(main.children, { autoAlpha: 1, clearProps: 'transform' })
      return
    }

    if (header) {
      gsap.from(header, { y: -16, autoAlpha: 0, duration: 0.45, ease: 'power3.out' })
    }
    if (main?.children.length) {
      gsap.from(main.children, {
        y: 24,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.1,
      })
    }
  }

  function pulseActive(el: Element | null | undefined) {
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(
      el,
      { scale: 0.9 },
      { scale: 1, duration: 0.35, ease: 'back.out(2)' },
    )
  }

  function pressFeedback(el: Element) {
    if (prefersReducedMotion()) return
    gsap.to(el, { scale: 0.92, duration: 0.08, ease: 'power2.in', overwrite: 'auto' })
  }

  function releaseFeedback(el: Element) {
    if (prefersReducedMotion()) return
    gsap.to(el, { scale: 1, duration: 0.25, ease: 'back.out(2)', overwrite: 'auto' })
  }

  function animateSidePanel(el: HTMLElement, collapsed: boolean) {
    const width = collapsed ? SIDE_PANEL_COLLAPSED : SIDE_PANEL_WIDTH
    if (prefersReducedMotion()) {
      gsap.set(el, { width })
      return
    }
    gsap.to(el, { width, duration: 0.3, ease: 'power2.inOut', overwrite: 'auto' })
  }

  function colorSelectPulse(el: Element | null | undefined) {
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(
      el,
      { scale: 0.85 },
      { scale: 1, duration: 0.3, ease: 'back.out(2)', overwrite: 'auto' },
    )
  }

  function fadeIn(el: Element | null | undefined, vars?: TweenVars) {
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1, clearProps: 'transform' })
      return
    }
    gsap.from(el, {
      autoAlpha: 0,
      y: 12,
      duration: 0.4,
      ease: 'power2.out',
      ...vars,
    })
  }

  function tabContentEnter(container: HTMLElement) {
    if (prefersReducedMotion()) return
    gsap.from(container, {
      autoAlpha: 0,
      y: 8,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  return {
    gsap,
    staggerIn,
    workspaceEntrance,
    pageEnter,
    pulseActive,
    pressFeedback,
    releaseFeedback,
    animateSidePanel,
    colorSelectPulse,
    fadeIn,
    tabContentEnter,
  }
}
