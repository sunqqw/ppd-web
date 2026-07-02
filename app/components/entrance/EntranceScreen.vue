<script setup lang="ts">
import { useGSAP } from '~/composables/useGSAP'

const emit = defineEmits<{ complete: [] }>()
const { gsap } = useGSAP()

const ENTRANCE_KEY = 'ppd-entrance-seen-v1'

const container = ref<HTMLElement | null>(null)
const visible = ref(true)
const exiting = ref(false)

const BEAD_COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff6bd6', '#ff9a3c', '#845ef7', '#20c997',
  '#fa5252', '#fab005', '#40c057', '#228be6',
]

/** 7×7 拼豆心形图案，'.' 为空格 */
const PATTERN = [
  '..#.#..',
  '.#####.',
  '#######',
  '.#####.',
  '..###..',
  '...#...',
  '.......',
]

const beads = computed(() => {
  const items: { id: string, color: string, row: number, col: number }[] = []
  let colorIdx = 0
  for (let row = 0; row < PATTERN.length; row++) {
    for (let col = 0; col < PATTERN[row].length; col++) {
      if (PATTERN[row][col] === '#') {
        items.push({
          id: `${row}-${col}`,
          color: BEAD_COLORS[colorIdx % BEAD_COLORS.length],
          row,
          col,
        })
        colorIdx++
      }
    }
  }
  return items
})

const floatBeads = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  color: BEAD_COLORS[i % BEAD_COLORS.length],
  left: `${6 + (i * 19) % 88}%`,
  top: `${8 + (i * 27) % 84}%`,
  size: 5 + (i % 4) * 4,
}))

const features = [
  { icon: '🖼️', text: '智能转图' },
  { icon: '🎨', text: '手绘编辑' },
  { icon: '📄', text: '导出打印' },
  { icon: '🔒', text: '本地运算' },
]

let ctx: ReturnType<typeof gsap.context> | undefined
let mm: ReturnType<typeof gsap.matchMedia> | undefined

function finish() {
  if (exiting.value || !container.value) return
  exiting.value = true
  sessionStorage.setItem(ENTRANCE_KEY, '1')

  ctx?.revert()

  const root = container.value
  const tl = gsap.timeline({
    onComplete: () => {
      visible.value = false
      emit('complete')
    },
  })

  tl.to(root.querySelectorAll('.entrance-bead'), {
    scale: 0,
    autoAlpha: 0,
    duration: 0.35,
    stagger: { amount: 0.25, from: 'center' },
    ease: 'back.in(1.4)',
  })
    .to(root.querySelectorAll('.entrance-content > *'), {
      y: -24,
      autoAlpha: 0,
      duration: 0.3,
      stagger: 0.05,
      ease: 'power2.in',
    }, 0)
    .to(root.querySelectorAll('.entrance-float'), {
      scale: 0,
      autoAlpha: 0,
      duration: 0.3,
      stagger: 0.02,
    }, 0)
    .to(root, {
      autoAlpha: 0,
      duration: 0.4,
      ease: 'power2.inOut',
    }, 0.15)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    finish()
  }
  else if (e.key === 'Escape') {
    finish()
  }
}

function playEntrance() {
  if (!container.value) return

  ctx?.revert()
  ctx = gsap.context(() => {
    mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set([
        '.entrance-bead',
        '.entrance-title, .entrance-tagline, .entrance-actions',
        '.entrance-feature',
        '.entrance-bg-grid',
        '.entrance-float',
      ], { autoAlpha: 1, clearProps: 'transform' })
    })

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.set('.entrance-bead', { scale: 0, autoAlpha: 0 })
      gsap.set('.entrance-title, .entrance-tagline, .entrance-actions', { y: 32, autoAlpha: 0 })
      gsap.set('.entrance-feature', { y: 32, autoAlpha: 0 })
      gsap.set('.entrance-bg-grid', { autoAlpha: 0 })
      gsap.set('.entrance-float', { scale: 0, autoAlpha: 0 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.to('.entrance-bg-grid', { autoAlpha: 1, duration: 0.8 })
        .to('.entrance-float', {
          scale: 1,
          autoAlpha: 0.35,
          duration: 0.6,
          stagger: 0.04,
          ease: 'back.out(1.4)',
        }, 0.1)
        .to('.entrance-bead', {
          scale: 1,
          autoAlpha: 1,
          duration: 0.55,
          stagger: { amount: 0.7, from: 'center' },
          ease: 'back.out(1.6)',
        }, 0.2)
        .to('.entrance-title', { y: 0, autoAlpha: 1, duration: 0.7 }, 0.55)
        .to('.entrance-tagline', { y: 0, autoAlpha: 1, duration: 0.6 }, 0.72)
        .to('.entrance-feature', {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.08,
        }, 0.85)
        .to('.entrance-actions', { y: 0, autoAlpha: 1, duration: 0.5 }, 1.05)
        .to('.entrance-cta', {
          boxShadow: '0 0 24px rgba(32, 128, 240, 0.45)',
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }, 1.2)

      gsap.to('.entrance-glow', {
        scale: 1.15,
        opacity: 0.55,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.utils.toArray<HTMLElement>('.entrance-float').forEach((el, i) => {
        gsap.to(el, {
          y: gsap.utils.random(-18, 18),
          x: gsap.utils.random(-14, 14),
          duration: gsap.utils.random(2.5, 4.5),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.12,
        })
      })
    })
  }, container.value)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  nextTick(() => playEntrance())
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  mm?.revert()
  ctx?.revert()
})
</script>

<template>
  <div
    v-if="visible"
    ref="container"
    class="entrance-screen"
    :class="{ exiting }"
  >
    <div class="entrance-bg">
      <div class="entrance-bg-grid" />
      <div class="entrance-glow" />
      <div class="entrance-floats" aria-hidden="true">
        <span
          v-for="b in floatBeads"
          :key="b.id"
          class="entrance-float"
          :style="{
            left: b.left,
            top: b.top,
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: b.color,
          }"
        />
      </div>
    </div>

    <div class="entrance-body">
      <div class="entrance-mosaic" aria-hidden="true">
        <div
          v-for="bead in beads"
          :key="bead.id"
          class="entrance-bead"
          :style="{
            '--bead-color': bead.color,
            gridRow: bead.row + 1,
            gridColumn: bead.col + 1,
          }"
        />
      </div>

      <div class="entrance-content">
        <h1 class="entrance-title">
          <span class="entrance-title-accent">拼豆</span>图纸生成器
        </h1>
        <p class="entrance-tagline">
          上传图片，一键生成可打印拼豆图纸
        </p>

        <div class="entrance-features">
          <div
            v-for="(feat, i) in features"
            :key="i"
            class="entrance-feature"
          >
            <span class="entrance-feature-icon">{{ feat.icon }}</span>
            <span>{{ feat.text }}</span>
          </div>
        </div>

        <div class="entrance-actions">
          <button class="entrance-cta" @click="finish">
            开始创作
          </button>
          <!-- <button class="entrance-skip" @click="finish">
            跳过介绍
            <kbd>Esc</kbd>
          </button> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entrance-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #0c1222 0%, #151d32 45%, #1a2744 100%);
  overflow: hidden;
}

.entrance-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.entrance-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%);
}

.entrance-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  width: 480px;
  height: 480px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(32, 128, 240, 0.18) 0%, transparent 70%);
  border-radius: 50%;
}

.entrance-floats {
  position: absolute;
  inset: 0;
}

.entrance-float {
  position: absolute;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.08);
  filter: blur(0.3px);
}

.entrance-body {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;
  padding: 24px;
  max-width: 520px;
  width: 100%;
}

.entrance-mosaic {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 5px;
  width: min(200px, 42vw);
  aspect-ratio: 1;
}

.entrance-bead {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--bead-color);
  box-shadow:
    inset 0 -3px 6px rgba(0, 0, 0, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.3);
}

.entrance-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.entrance-title {
  font-size: clamp(1.75rem, 5vw, 2.25rem);
  font-weight: 700;
  color: #f0f4ff;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.entrance-title-accent {
  background: linear-gradient(135deg, #4d96ff, #ff6bd6, #ffd93d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.entrance-tagline {
  font-size: 14px;
  color: rgba(200, 210, 230, 0.75);
  line-height: 1.6;
  max-width: 360px;
}

.entrance-features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 16px;
}

.entrance-feature {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(180, 195, 220, 0.9);
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.entrance-feature-icon {
  font-size: 15px;
}

.entrance-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.entrance-cta {
  padding: 14px 48px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #2080f0, #4d96ff);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(32, 128, 240, 0.35);
  transition: transform 0.15s;
}

.entrance-cta:hover {
  transform: translateY(-2px);
}

.entrance-cta:active {
  transform: translateY(0);
}

.entrance-skip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(160, 175, 200, 0.6);
  padding: 4px 12px;
  transition: color 0.15s;
}

.entrance-skip:hover {
  color: rgba(200, 210, 230, 0.9);
}

.entrance-skip kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(180, 195, 220, 0.7);
}

@media (max-width: 480px) {
  .entrance-body {
    gap: 28px;
  }

  .entrance-mosaic {
    width: min(160px, 38vw);
    gap: 4px;
  }
}
</style>
