import type { Rgba } from './ir'

/**
 * Somewhere to record a color string no parser understood. A parameter rather
 * than module state, so calls made outside an export run cannot accumulate
 * into the next one.
 */
export type UnparsedColors = Set<string> | undefined

function numbers(body: string): number[] {
  return body.split(/[\s,/]+/).filter(Boolean).map((token) => {
    const n = Number.parseFloat(token)
    return token.endsWith('%') ? n / 100 : n
  })
}

function srgbChannel(v: number): number {
  // The sRGB transfer function, for converting linear light back to 0-255.
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(c * 255)))
}

/** Oklab to sRGB, per the CSS Color 4 conversion. */
function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  return [
    srgbChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    srgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    srgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ]
}

function hueToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const [r, g, b]
    = hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x]
  const m = l - c / 2
  const to255 = (v: number) => Math.max(0, Math.min(255, Math.round((v + m) * 255)))
  return [to255(r), to255(g), to255(b)]
}

/**
 * A computed CSS color, in any syntax Chromium actually serializes: a theme
 * authored in modern syntax keeps `oklch()`, `color()` or `hsl()` in the
 * computed value, and dropping those loses every fill on the slide.
 */
export function parseColor(value: string | undefined, unparsed?: UnparsedColors): Rgba | undefined {
  if (!value)
    return undefined
  const text = value.trim()
  if (text === 'transparent')
    return { r: 0, g: 0, b: 0, a: 0 }

  const fn = text.match(/^([a-z-]+)\(([^)]+)\)$/i)
  if (!fn) {
    unparsed?.add(text)
    return undefined
  }
  const name = fn[1].toLowerCase()

  if (name === 'color') {
    // Before the numeric guard: the first token is a color space name, so
    // parsing the whole body as numbers would reject every `color()` value.
    const tokens = fn[2].trim().split(/[\s,/]+/).filter(Boolean)
    const channels = numbers(tokens.slice(1).join(' '))
    if (tokens[0] === 'srgb' && channels.length >= 3 && !channels.slice(0, 3).some(Number.isNaN)) {
      return {
        r: Math.round(channels[0] * 255),
        g: Math.round(channels[1] * 255),
        b: Math.round(channels[2] * 255),
        a: channels.length > 3 && !Number.isNaN(channels[3]) ? channels[3] : 1,
      }
    }
    unparsed?.add(text)
    return undefined
  }

  const parts = numbers(fn[2])
  if (parts.some(Number.isNaN)) {
    unparsed?.add(text)
    return undefined
  }
  const alpha = (index: number) => (parts.length > index ? parts[index] : 1)

  if (name === 'rgb' || name === 'rgba') {
    if (parts.length < 3)
      return undefined
    // Percentage channels were divided by 100 above, so scale them back.
    const channel = (v: number, raw: string) => (raw.includes('%') ? v * 255 : v)
    const raw = fn[2].split(/[\s,/]+/).filter(Boolean)
    return {
      r: channel(parts[0], raw[0] ?? ''),
      g: channel(parts[1], raw[1] ?? ''),
      b: channel(parts[2], raw[2] ?? ''),
      a: alpha(3),
    }
  }

  if (name === 'hsl' || name === 'hsla') {
    if (parts.length < 3)
      return undefined
    const [r, g, b] = hueToRgb(parts[0], parts[1], parts[2])
    return { r, g, b, a: alpha(3) }
  }

  if (name === 'oklch' || name === 'oklab') {
    if (parts.length < 3)
      return undefined
    const L = parts[0]
    const [a, b] = name === 'oklch'
      ? [parts[1] * Math.cos((parts[2] * Math.PI) / 180), parts[1] * Math.sin((parts[2] * Math.PI) / 180)]
      : [parts[1], parts[2]]
    const [r, g, bb] = oklabToRgb(L, a, b)
    return { r, g, b: bb, a: alpha(3) }
  }

  unparsed?.add(text)
  return undefined
}

/** Whether a color contributes any ink at all. */
export function isVisible(color: Rgba | undefined): boolean {
  return !!color && color.a > 0
}

/**
 * Fold an element's effective opacity into a color's own alpha: DrawingML has
 * no element-level or group opacity, only per-fill alpha. The walker compounds
 * the value down the tree, since CSS `opacity` does not inherit.
 */
export function withOpacity(color: Rgba | undefined, opacity: number | undefined): Rgba | undefined {
  if (!color)
    return undefined
  if (opacity === undefined || !Number.isFinite(opacity) || opacity >= 1)
    return color
  return { ...color, a: color.a * Math.max(0, opacity) }
}
