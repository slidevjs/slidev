import { describe, expect, it } from 'vitest'
import { mergeCameraConfig } from '../packages/parser/src/camera'
import { resolveConfig } from '../packages/parser/src/config'

describe('camera config', () => {
  it('merges headmatter camera over theme defaults per field', () => {
    const config = resolveConfig({
      camera: { size: 160 },
    }, {
      defaults: {
        camera: { position: 'bottom-left', size: 200 },
      },
    })

    expect(config.camera).toEqual({
      position: 'bottom-left',
      size: 160,
    })
  })

  it('merges defaults.camera under a slide override per field', () => {
    expect(mergeCameraConfig(
      { position: 'bottom-right', size: 200 },
      { size: 120 },
    )).toEqual({
      position: 'bottom-right',
      size: 120,
    })
  })

  it('returns undefined when neither side sets a camera', () => {
    expect(mergeCameraConfig(undefined, undefined)).toBeUndefined()
    expect(mergeCameraConfig({}, {})).toBeUndefined()
  })
})
