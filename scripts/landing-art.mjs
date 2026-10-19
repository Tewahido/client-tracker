// Recolours 3D emoji PNGs into Lendly's palette for the landing page.
//
// Source art: Microsoft Fluent Emoji 3D (MIT), https://github.com/microsoft/fluentui-emoji
// Usage: node scripts/landing-art.mjs <folder with downloaded PNGs> [output folder]
//
// Each image keeps its 3D shading (luminance) but is mapped onto the brand ramp
// deep emerald -> brand green -> cyan highlight, so the set reads as one family that
// matches the app's colours.
import { mkdir, readdir } from 'node:fs/promises'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const [source, output = 'public/landing'] = process.argv.slice(2)
if (!source) {
  console.error('Usage: node scripts/landing-art.mjs <source folder> [output folder]')
  process.exit(1)
}

/** Brand ramp, dark to light (matches --color-brand-* and --color-sky-brand). */
const RAMP = [
  [0.0, [2, 44, 34]], // #022c22 deep emerald
  [0.35, [5, 150, 105]], // #059669 brand-600
  [0.65, [52, 211, 153]], // #34d399 brand-400
  [0.85, [34, 211, 238]], // #22d3ee sky-brand
  [1.0, [207, 250, 254]], // #cffafe cyan highlight
]

function rampColor(t) {
  for (let i = 1; i < RAMP.length; i++) {
    const [p1, c1] = RAMP[i]
    const [p0, c0] = RAMP[i - 1]
    if (t <= p1) {
      const k = (t - p0) / (p1 - p0)
      return c0.map((v, j) => Math.round(v + (c1[j] - v) * k))
    }
  }
  return RAMP[RAMP.length - 1][1]
}

const SIZE = 192
await mkdir(output, { recursive: true })
for (const file of (await readdir(source)).filter((f) => f.endsWith('.png') && !f.startsWith('_'))) {
  const { data, info } = await sharp(join(source, file)).resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    // Perceived luminance, stretched a little for contrast.
    const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
    const [r, g, b] = rampColor(Math.min(1, Math.max(0, (l - 0.08) * 1.15)))
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
  const out = join(output, `${parse(file).name}.webp`)
  await sharp(data, { raw: info }).webp({ quality: 88, alphaQuality: 90 }).toFile(out)
  console.log('wrote', out)
}
