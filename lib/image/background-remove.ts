import { toleranceToDistanceSq } from '../color/rgb'

export function removeBackground(imageData: ImageData, tolerance: number): ImageData {
  const { width, height, data } = imageData
  const total = width * height
  const isBg = new Uint8Array(total)
  const visited = new Uint8Array(total)
  const maxDistSq = toleranceToDistanceSq(tolerance)

  const queue = new Int32Array(total)
  let head = 0
  let tail = 0

  const enqueue = (idx: number) => {
    if (visited[idx]) return
    queue[tail++] = idx
  }

  for (let x = 0; x < width; x++) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (head < tail) {
    const pi = queue[head++]
    if (visited[pi]) continue

    visited[pi] = 1
    isBg[pi] = 1

    const x = pi % width
    const y = (pi / width) | 0
    const di = pi * 4
    const cr = data[di]
    const cg = data[di + 1]
    const cb = data[di + 2]

    if (x > 0) {
      const ni = pi - 1
      if (!visited[ni]) {
        const ni4 = ni * 4
        const dr = cr - data[ni4]
        const dg = cg - data[ni4 + 1]
        const db = cb - data[ni4 + 2]
        if (dr * dr + dg * dg + db * db <= maxDistSq) enqueue(ni)
      }
    }
    if (x < width - 1) {
      const ni = pi + 1
      if (!visited[ni]) {
        const ni4 = ni * 4
        const dr = cr - data[ni4]
        const dg = cg - data[ni4 + 1]
        const db = cb - data[ni4 + 2]
        if (dr * dr + dg * dg + db * db <= maxDistSq) enqueue(ni)
      }
    }
    if (y > 0) {
      const ni = pi - width
      if (!visited[ni]) {
        const ni4 = ni * 4
        const dr = cr - data[ni4]
        const dg = cg - data[ni4 + 1]
        const db = cb - data[ni4 + 2]
        if (dr * dr + dg * dg + db * db <= maxDistSq) enqueue(ni)
      }
    }
    if (y < height - 1) {
      const ni = pi + width
      if (!visited[ni]) {
        const ni4 = ni * 4
        const dr = cr - data[ni4]
        const dg = cg - data[ni4 + 1]
        const db = cb - data[ni4 + 2]
        if (dr * dr + dg * dg + db * db <= maxDistSq) enqueue(ni)
      }
    }
  }

  const result = new ImageData(width, height)
  result.data.set(data)
  for (let i = 0; i < total; i++) {
    if (isBg[i]) result.data[i * 4 + 3] = 0
  }
  return result
}
