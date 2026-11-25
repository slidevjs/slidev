import type { CameraAnchor, CameraConfig } from '@slidev/types'

/** Named corners accepted by `camera.position` and `camera.x`. */
export const CAMERA_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

/**
 * Inset from the viewport edge for named anchors and the built-in default.
 * Same gap the overlay used before camera config existed.
 */
export const CAMERA_EDGE_MARGIN = 30

/** Smallest diameter the resize handle can produce. */
export const CAMERA_MIN_SIZE = 10

export interface CameraViewport {
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
 * Matches the historical `slidev-webcam-size` initial value.
 *
 * @param viewport - Current viewport size, in pixels
 * @returns Diameter in pixels
 */
export function builtinCameraSize(viewport: CameraViewport): number {
  return Math.round(Math.min(viewport.height, viewport.width / 8))
}

/**
 * Viewport coordinates for a named corner.
 *
 * @param anchor - Corner name
 * @param viewport - Current viewport size, in pixels
 * @param size - Bubble diameter, in pixels
 * @param margin - Inset from the edges. Defaults to {@link CAMERA_EDGE_MARGIN}
 * @returns Top-left of the bubble, in pixels
 */
export function cameraAnchorPosition(
  anchor: CameraAnchor,
  viewport: CameraViewport,
  size: number,
  margin = CAMERA_EDGE_MARGIN,
): Pick<CameraPlacement, 'x' | 'y'> {
  return {
    x: anchor.endsWith('right') ? viewport.width - size - margin : margin,
    y: anchor.startsWith('bottom') ? viewport.height - size - margin : margin,
  }
}

/**
 * Pull the bubble back inside the viewport when a resize leaves it past the right or bottom edge.
 *
 * @param placement - Current position and size
 * @param viewport - Current viewport size, in pixels
 * @param margin - Inset used when clamping. Defaults to {@link CAMERA_EDGE_MARGIN}
 * @returns The placement, moved if it sat outside the viewport
 */
export function clampCameraToViewport(
  placement: CameraPlacement,
  viewport: CameraViewport,
  margin = CAMERA_EDGE_MARGIN,
): CameraPlacement {
  let { x, y } = placement
  if (x >= viewport.width)
    x = viewport.width - placement.size - margin
  if (y >= viewport.height)
    y = viewport.height - placement.size - margin
  return { x, y, size: placement.size }
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
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
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
  const anchor = normalizeAnchor(config.position) ?? (typeof config.x === 'string' ? normalizeAnchor(config.x) : undefined)
  const size = finite(config.size)
  return {
    x: finite(config.x),
    y: finite(config.y),
    anchor,
    size: size == null ? undefined : Math.max(CAMERA_MIN_SIZE, size),
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
  return hasCameraConfig(slide) || hasCameraConfig(global) ? 'session' : 'storage'
}

export interface ResolveCameraOptions {
  /** Current slide frontmatter, already merged with `defaults.camera`. */
  slide?: CameraConfig | null
  /** Deck headmatter `camera`. */
  global?: CameraConfig | null
  /** Drag or resize remembered for this slide during the current page load. */
  session?: Partial<CameraPlacement> | null
  /** Browser fallback (`slidev-webcam-pos` / `slidev-webcam-size`). */
  stored?: Partial<CameraPlacement> | null
  /** Current viewport size, in pixels. */
  viewport: CameraViewport
  /** Inset for named anchors. Defaults to {@link CAMERA_EDGE_MARGIN}. */
  margin?: number
}

/**
 * Resolve the camera bubble's viewport position and diameter.
 *
 * Each of `x`, `y`, and `size` uses the first value that is set, in this order:
 * session override, slide frontmatter, headmatter, the saved browser value, then the built-in bottom-right default.
 *
 * @param options - Config layers and the current viewport
 * @returns Top-left position and diameter, in pixels
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
    ?? builtinCameraSize(options.viewport)
  const fallback = cameraAnchorPosition('bottom-right', options.viewport, size, margin)

  function axis(
    which: 'x' | 'y',
    fromAnchor: (anchor: CameraAnchor) => number,
  ): number {
    return finite(session[which])
      ?? slide[which]
      ?? (slide.anchor ? fromAnchor(slide.anchor) : undefined)
      ?? global[which]
      ?? (global.anchor ? fromAnchor(global.anchor) : undefined)
      ?? finite(stored[which])
      ?? fallback[which]
  }

  return {
    x: axis('x', anchor => cameraAnchorPosition(anchor, options.viewport, size, margin).x),
    y: axis('y', anchor => cameraAnchorPosition(anchor, options.viewport, size, margin).y),
    size,
  }
}
