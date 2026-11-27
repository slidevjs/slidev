import type { CameraAnchor, CameraConfig } from '@slidev/types'

/** Named corners accepted by `camera.position` and `camera.x`. */
export const CAMERA_ANCHORS = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const

/**
 * Inset from the slide edge for named anchors and the built-in default, in canvas pixels.
 */
export const CAMERA_EDGE_MARGIN = 30

/** Smallest diameter the resize handle can produce, in canvas pixels. */
export const CAMERA_MIN_SIZE = 10

/** Slide canvas size, in the same pixels as `canvasWidth`. */
export interface CameraCanvas {
  width: number
  height: number
}

/** On-screen box of the main slide, from `getBoundingClientRect`. */
export interface CameraScreenRect {
  left: number
  top: number
  width: number
  height: number
}

export interface CameraPlacement {
  x: number
  y: number
  size: number
}

/**
 * Where a drag or resize is kept.
 * `session` is per slide and lasts until reload. `storage` is the shared localStorage value.
 */
export type CameraAdjustmentTarget = 'session' | 'storage'

interface NormalizedCamera {
  x?: number
  y?: number
  anchor?: CameraAnchor
  size?: number
}

/**
 * Default bubble diameter when nothing else specifies a size.
 * Uses the slide canvas, so the on-screen size matches the old window default when the slide fills the window.
 *
 * @param canvas - Slide canvas size, in pixels
 * @returns Diameter in canvas pixels
 */
export function builtinCameraSize(canvas: CameraCanvas): number {
  return Math.round(Math.min(canvas.height, canvas.width / 8))
}

/**
 * Canvas coordinates for a named corner of the slide.
 *
 * @param anchor - Corner name
 * @param canvas - Slide canvas size, in pixels
 * @param size - Bubble diameter, in canvas pixels
 * @param margin - Inset from the slide edges. Defaults to {@link CAMERA_EDGE_MARGIN}
 * @returns Top-left of the bubble, in canvas pixels
 */
export function cameraAnchorPosition(
  anchor: CameraAnchor,
  canvas: CameraCanvas,
  size: number,
  margin = CAMERA_EDGE_MARGIN,
): Pick<CameraPlacement, 'x' | 'y'> {
  return {
    x: anchor.endsWith('right')
      ? canvas.width - size - margin
      : margin,
    y: anchor.startsWith('bottom')
      ? canvas.height - size - margin
      : margin,
  }
}

/** Browser viewport size, in screen pixels. */
export interface CameraWindow {
  width: number
  height: number
}

/**
 * Pull the bubble back when its top-left passes the right or bottom of the window.
 * It may still sit outside the slide, or hang off the left and top.
 *
 * @param placement - Position and size in screen pixels
 * @param windowSize - Browser viewport size, in screen pixels
 * @param margin - Inset used when pulling back. Defaults to {@link CAMERA_EDGE_MARGIN}
 * @returns The placement, moved only if it left the window
 */
export function clampCameraToWindow(
  placement: CameraPlacement,
  windowSize: CameraWindow,
  margin = CAMERA_EDGE_MARGIN,
): CameraPlacement {
  let { x, y } = placement
  if (x >= windowSize.width)
    x = windowSize.width - placement.size - margin
  if (y >= windowSize.height)
    y = windowSize.height - placement.size - margin
  return { x, y, size: placement.size }
}

/**
 * Scale from slide-canvas pixels to the main slide's on-screen box.
 *
 * @param rect - Main slide bounding box, in screen pixels
 * @param canvas - Slide canvas size, in pixels
 * @returns Screen pixels per canvas pixel, or `0` when either box is empty
 */
export function cameraScale(rect: CameraScreenRect, canvas: CameraCanvas): number {
  if (canvas.width <= 0 || rect.width <= 0)
    return 0
  return rect.width / canvas.width
}

/**
 * Map a canvas placement onto the screen using the main slide's bounding box.
 *
 * @param placement - Position and size in canvas pixels
 * @param rect - Main slide bounding box, in screen pixels
 * @param canvas - Slide canvas size, in pixels
 * @returns Position and size in screen pixels
 */
export function projectCamera(
  placement: CameraPlacement,
  rect: CameraScreenRect,
  canvas: CameraCanvas,
): CameraPlacement {
  const scale = cameraScale(rect, canvas)
  return {
    x: rect.left + placement.x * scale,
    y: rect.top + placement.y * scale,
    size: placement.size * scale,
  }
}

/**
 * Map a screen placement back into slide-canvas pixels.
 *
 * @param placement - Position and size in screen pixels
 * @param rect - Main slide bounding box, in screen pixels
 * @param canvas - Slide canvas size, in pixels
 * @returns Position and size in canvas pixels. Returns `placement` unchanged when the slide box is empty
 */
export function unprojectCamera(
  placement: CameraPlacement,
  rect: CameraScreenRect,
  canvas: CameraCanvas,
): CameraPlacement {
  const scale = cameraScale(rect, canvas)
  if (scale === 0)
    return { ...placement }
  return {
    x: (placement.x - rect.left) / scale,
    y: (placement.y - rect.top) / scale,
    size: placement.size / scale,
  }
}

function normalizeAnchor(value: unknown): CameraAnchor | undefined {
  if (typeof value !== 'string')
    return undefined
  const normalized = value.trim().toLowerCase()
  return (CAMERA_ANCHORS as readonly string[]).includes(normalized)
    ? normalized as CameraAnchor
    : undefined
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined
}

/**
 * Read the fields a camera config actually sets.
 * Unknown anchors and non-numeric coordinates are ignored.
 *
 * @param config - Slide or headmatter camera config
 * @returns Normalized axes. `size` is at least {@link CAMERA_MIN_SIZE}
 */
export function normalizeCameraConfig(config?: CameraConfig | null): NormalizedCamera {
  if (!config || typeof config !== 'object')
    return {}
  const anchor = normalizeAnchor(config.position) ?? (typeof config.x === 'string'
    ? normalizeAnchor(config.x)
    : undefined)
  const size = finite(config.size)
  return {
    x: finite(config.x),
    y: finite(config.y),
    anchor,
    size: size == null
      ? undefined
      : Math.max(CAMERA_MIN_SIZE, size),
  }
}

/**
 * Whether a config sets any position or size field.
 *
 * @param config - Slide or headmatter camera config
 * @returns `true` when the config should take part in placement
 */
export function hasCameraConfig(config?: CameraConfig | null): boolean {
  const normalized = normalizeCameraConfig(config)
  return normalized.x != null || normalized.y != null || normalized.anchor != null || normalized.size != null
}

/**
 * Decide where a manual drag or resize is stored.
 * Configured decks keep the adjustment on the current slide for this page load.
 * Decks with no camera config keep writing the shared browser value.
 *
 * @param slide - Current slide `camera` frontmatter
 * @param global - Deck headmatter `camera`
 * @returns `session` when either config sets a field, otherwise `storage`
 */
export function cameraAdjustmentTarget(
  slide?: CameraConfig | null,
  global?: CameraConfig | null,
): CameraAdjustmentTarget {
  return hasCameraConfig(slide) || hasCameraConfig(global)
    ? 'session'
    : 'storage'
}

export interface ResolveCameraOptions {
  /** Current slide frontmatter, already merged with `defaults.camera`. */
  slide?: CameraConfig | null
  /** Deck headmatter `camera`. */
  global?: CameraConfig | null
  /** Drag or resize remembered for this slide during the current page load. */
  session?: Partial<CameraPlacement> | null
  /** Saved drag (`slidev-webcam-slide-pos` / `slidev-webcam-slide-size`), in canvas pixels. */
  stored?: Partial<CameraPlacement> | null
  /** Slide canvas size, in pixels. */
  canvas: CameraCanvas
  /** Inset for named anchors. Defaults to {@link CAMERA_EDGE_MARGIN}. */
  margin?: number
}

/**
 * Resolve the camera bubble's position and diameter on the slide canvas.
 *
 * Each of `x`, `y`, and `size` uses the first value that is set, in this order:
 * session override, slide frontmatter, headmatter, the saved position, then the built-in bottom-right default.
 *
 * @param options - Config layers and the slide canvas
 * @returns Top-left position and diameter, in canvas pixels
 */
export function resolveCamera(options: ResolveCameraOptions): CameraPlacement {
  const margin = options.margin ?? CAMERA_EDGE_MARGIN
  const slide = normalizeCameraConfig(options.slide)
  const global = normalizeCameraConfig(options.global)
  const session = options.session ?? {}
  const stored = options.stored ?? {}
  const size = finite(session.size)
    ?? slide.size
    ?? global.size
    ?? finite(stored.size)
    ?? builtinCameraSize(options.canvas)
  const fallback = cameraAnchorPosition('bottom-right', options.canvas, size, margin)

  function axis(
    which: 'x' | 'y',
    fromAnchor: (anchor: CameraAnchor) => number,
  ): number {
    return finite(session[which])
      ?? slide[which]
      ?? (slide.anchor
        ? fromAnchor(slide.anchor)
        : undefined)
      ?? global[which]
      ?? (global.anchor
        ? fromAnchor(global.anchor)
        : undefined)
      ?? finite(stored[which])
      ?? fallback[which]
  }

  return {
    x: axis('x', anchor => cameraAnchorPosition(anchor, options.canvas, size, margin).x),
    y: axis('y', anchor => cameraAnchorPosition(anchor, options.canvas, size, margin).y),
    size,
  }
}
