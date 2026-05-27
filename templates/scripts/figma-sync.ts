/**
 * Fetches color styles from a Figma file and writes CSS variable values
 * to the Token Direction section of docs/visual-system.md.
 *
 * Setup:
 *   1. Copy figma.config.example.json → figma.config.json and fill in your file ID + mapping
 *   2. Set FIGMA_API_TOKEN in .env or the shell (get one at figma.com/developers/api)
 *   3. Run: pnpm figma:sync
 *
 * Only FILL (solid color) styles are supported. Text and effect styles are skipped.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface FigmaConfig {
  fileId: string
  // Maps Figma style name → CSS variable name (e.g. "Brand/Primary 500" → "--primary")
  mapping: Record<string, string>
}

interface FigmaStyleEntry {
  node_id: string
  name: string
  style_type: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
}

interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}

function rgbToHsl(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function colorToValue(color: RgbaColor): string {
  const hsl = rgbToHsl(color.r, color.g, color.b)
  // Output format matches shadcn/ui CSS variable convention: bare HSL values
  // used as: hsl(var(--primary))
  return color.a < 1
    ? `${hsl} / ${Math.round(color.a * 100)}%`
    : hsl
}

function loadDotEnv() {
  const envPath = join(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    const rawValue = trimmed.slice(eq + 1).trim()
    if (!key || process.env[key] !== undefined) continue

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

async function figmaGet(token: string, path: string) {
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { 'X-Figma-Token': token },
  })
  if (!res.ok) throw new Error(`Figma API ${path} → ${res.status} ${res.statusText}`)
  return res.json()
}

async function main() {
  loadDotEnv()
  const token = process.env.FIGMA_API_TOKEN
  if (!token) throw new Error('FIGMA_API_TOKEN is not set in .env or the shell')

  const configPath = join(process.cwd(), 'figma.config.json')
  if (!existsSync(configPath)) {
    throw new Error(
      'figma.config.json not found.\n' +
      'Copy figma.config.example.json → figma.config.json and fill in your file ID and mapping.'
    )
  }

  const config: FigmaConfig = JSON.parse(readFileSync(configPath, 'utf8'))
  console.log(`Syncing from Figma file: ${config.fileId}`)

  // 1. Fetch all styles from the file
  const stylesData = await figmaGet(token, `/files/${config.fileId}/styles`)
  const styles: FigmaStyleEntry[] = stylesData.meta?.styles ?? []
  console.log(`  Found ${styles.length} styles in file`)

  // Index styles by name for fast lookup
  const stylesByName = new Map(styles.map(s => [s.name, s]))

  // 2. Collect node IDs for the mapped styles
  const toFetch: Array<{ figmaName: string; cssVar: string; nodeId: string }> = []
  for (const [figmaName, cssVar] of Object.entries(config.mapping)) {
    const style = stylesByName.get(figmaName)
    if (!style) {
      console.warn(`  ⚠  Style not found in file: "${figmaName}" (for ${cssVar})`)
      continue
    }
    if (style.style_type !== 'FILL') {
      console.warn(`  ⚠  Skipping non-FILL style: "${figmaName}" (type: ${style.style_type})`)
      continue
    }
    toFetch.push({ figmaName, cssVar, nodeId: style.node_id })
  }

  if (toFetch.length === 0) {
    throw new Error('No matching FILL styles found. Check your figma.config.json mapping.')
  }

  // 3. Fetch nodes in one batch request
  const nodeIds = toFetch.map(t => t.nodeId).join(',')
  const nodesData = await figmaGet(token, `/files/${config.fileId}/nodes?ids=${encodeURIComponent(nodeIds)}`)

  // 4. Extract color values
  const tokens: Array<{ cssVar: string; value: string; figmaName: string }> = []

  for (const item of toFetch) {
    const node = nodesData.nodes?.[item.nodeId]?.document
    const fill = node?.fills?.find((f: any) => f.type === 'SOLID')
    if (!fill?.color) {
      console.warn(`  ⚠  No solid fill on "${item.figmaName}" — skipped`)
      continue
    }

    const value = colorToValue(fill.color as RgbaColor)
    tokens.push({ cssVar: item.cssVar, value, figmaName: item.figmaName })
    console.log(`  ✓  ${item.cssVar}: ${value}  (from "${item.figmaName}")`)
  }

  // 5. Write to docs/visual-system.md
  const vsPath = join(process.cwd(), 'docs', 'visual-system.md')
  if (!existsSync(vsPath)) {
    console.log('\nNo docs/visual-system.md found. Printing values instead:\n')
    tokens.forEach(t => console.log(`  ${t.cssVar}: ${t.value};`))
    console.log('\nCreate docs/visual-system.md (run quality-designer workflow) to enable auto-write.')
    return
  }

  let content = readFileSync(vsPath, 'utf8')
  const sectionHeader = '## Token Direction (from Figma)'

  const generated = [
    sectionHeader,
    '',
    '<!-- Auto-generated by scripts/figma-sync.ts — do not edit this section manually -->',
    '',
    '```css',
    ':root {',
    ...tokens.map(t => `  ${t.cssVar}: ${t.value};`),
    '}',
    '```',
    '',
    `*Last synced: ${new Date().toISOString().split('T')[0]}*`,
    '',
  ].join('\n')

  if (content.includes(sectionHeader)) {
    const escapedHeader = sectionHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    content = content.replace(
      new RegExp(`${escapedHeader}[\\s\\S]*?(?=\n## |$)`),
      generated
    )
  } else {
    content = content.trimEnd() + '\n\n' + generated
  }

  writeFileSync(vsPath, content)
  console.log(`\n✓ Wrote ${tokens.length} token(s) to docs/visual-system.md`)
  console.log('  Next: Phase 3 token application step will apply these to src/index.css.')
}

main().catch(err => {
  console.error('\n✗', err.message)
  process.exit(1)
})
