// Renders the PWA / home-screen icons from public/favicon.svg.
// Run with `npm run icons` after changing the logo; the PNGs are committed.
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

const OUT = 'public/icons'
const svg = await readFile('public/favicon.svg')
const BACKGROUND = '#0a0c11'

/** Full-bleed logo at the given size. */
const plain = (size) => sharp(svg, { density: 384 }).resize(size, size)

/** Logo inset on a solid background, leaving the safe zone Android needs for maskable icons. */
async function padded(size, scale) {
  const inner = Math.round(size * scale)
  const logo = await plain(inner).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } }).composite([{ input: logo, gravity: 'center' }])
}

/** White check mark on transparent, for the Android status-bar badge. */
const badgeSvg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M14 34.5 26.5 47 50 18" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
)

await Promise.all([
  plain(192).png().toFile(`${OUT}/icon-192.png`),
  plain(512).png().toFile(`${OUT}/icon-512.png`),
  (await padded(512, 0.62)).png().toFile(`${OUT}/maskable-512.png`),
  (await padded(180, 0.8)).png().toFile(`${OUT}/apple-touch-icon.png`),
  sharp(badgeSvg, { density: 384 }).resize(96, 96).png().toFile(`${OUT}/badge-96.png`),
])
console.log('Icons written to', OUT)
