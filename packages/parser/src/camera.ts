import type { CameraConfig } from '@slidev/types'

const CAMERA_KEYS = ['x', 'y', 'size', 'position'] as const

/**
 * Field-wise merge of two camera configs.
 * `override` wins per key. Nullish keys are dropped so a slide can
 * replace `defaults.camera` without wiping unspecified axes.
 *
 * @param base - Deck defaults, usually `headmatter.defaults.camera`
 * @param override - The slide's own `camera` frontmatter
 * @returns The merged config, or `undefined` when neither side sets a field
 */
export function mergeCameraConfig(
  base?: CameraConfig | null,
  override?: CameraConfig | null,
): CameraConfig | undefined {
  const merged: CameraConfig = {}
  for (const source of [base, override]) {
    if (!source || typeof source !== 'object')
      continue
    for (const key of CAMERA_KEYS) {
      const value = source[key]
      if (value != null)
        merged[key] = value as never
    }
  }
  return Object.keys(merged).length ? merged : undefined
}
