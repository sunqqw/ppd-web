import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = readFileSync(join(root, 'pdsh.js'), 'utf8')
const fn = new Function(`${src}; return palettes;`)
const palettes = fn()

const outDir = join(root, 'data', 'palettes')
mkdirSync(outDir, { recursive: true })

for (const [key, palette] of Object.entries(palettes)) {
  const colors = []
  for (const [seriesKey, series] of Object.entries(palette.series)) {
    for (const color of series.colors) {
      colors.push({
        id: color.name,
        hex: color.hex,
        series: seriesKey,
        seriesName: series.name,
      })
    }
  }
  const output = {
    key,
    name: palette.name,
    info: palette.info,
    colors,
  }
  writeFileSync(join(outDir, `${key}.json`), JSON.stringify(output, null, 2))
  console.log(`✓ ${key}.json (${colors.length} colors)`)
}
