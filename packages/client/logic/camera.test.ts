import { describe, expect, it } from 'vitest'
import {
  builtinCameraSize,
  cameraAdjustmentTarget,
  cameraAnchorPosition,
  clampCameraToWindow,
  projectCamera,
  resolveCamera,
  unprojectCamera,
} from './camera'

const canvas = { width: 980, height: 551 }

describe('resolveCamera', () => {
  it('falls back to the built-in bottom-right corner of the slide', () => {
    const size = builtinCameraSize(canvas)
    expect(resolveCamera({ canvas })).toEqual({
      ...cameraAnchorPosition('bottom-right', canvas, size),
      size,
    })
  })

  it('uses the saved slide position when the deck has no camera config', () => {
    expect(resolveCamera({
      canvas,
      stored: { x: 12, y: 24, size: 100 },
    })).toEqual({ x: 12, y: 24, size: 100 })
  })

  it('applies a global anchor and size ahead of the saved position', () => {
    expect(resolveCamera({
      canvas,
      global: { position: 'bottom-left', size: 160 },
      stored: { x: 12, y: 24, size: 100 },
    })).toEqual({
      ...cameraAnchorPosition('bottom-left', canvas, 160),
      size: 160,
    })
  })

  it('accepts numeric coordinates and a named anchor in x', () => {
    expect(resolveCamera({
      canvas,
      global: { x: 40, y: 50, size: 200 },
    })).toEqual({ x: 40, y: 50, size: 200 })

    expect(resolveCamera({
      canvas,
      global: { x: 'top-right', size: 180 },
    })).toEqual({
      ...cameraAnchorPosition('top-right', canvas, 180),
      size: 180,
    })
  })

  it('lets a slide override individual fields', () => {
    expect(resolveCamera({
      canvas,
      global: { position: 'top-left', size: 200 },
      slide: { position: 'bottom-left' },
    })).toEqual({
      ...cameraAnchorPosition('bottom-left', canvas, 200),
      size: 200,
    })

    expect(resolveCamera({
      canvas,
      global: { x: 40, y: 50, size: 200 },
      slide: { size: 120 },
    })).toEqual({ x: 40, y: 50, size: 120 })

    expect(resolveCamera({
      canvas,
      global: { position: 'top-right', size: 200 },
      slide: { y: 80 },
    })).toEqual({
      x: cameraAnchorPosition('top-right', canvas, 200).x,
      y: 80,
      size: 200,
    })
  })

  it('prefers a session adjustment over frontmatter', () => {
    expect(resolveCamera({
      canvas,
      global: { position: 'top-left', size: 200 },
      slide: { position: 'bottom-left', size: 160 },
      session: { x: 300, y: 400, size: 90 },
    })).toEqual({ x: 300, y: 400, size: 90 })
  })

  it('ignores unknown anchors and clamps tiny sizes', () => {
    const size = builtinCameraSize(canvas)
    expect(resolveCamera({
      canvas,
      global: { position: 'middle' as 'top-left', size: 4 },
      stored: { x: 8, y: 9 },
    })).toEqual({ x: 8, y: 9, size: 10 })

    expect(resolveCamera({
      canvas,
      slide: { x: 'nope' as 'top-left' },
      stored: { x: 8, y: 9, size },
    })).toEqual({ x: 8, y: 9, size })
  })
})

describe('cameraAdjustmentTarget', () => {
  it('keeps browser storage when nothing is configured', () => {
    expect(cameraAdjustmentTarget(undefined, {})).toBe('storage')
    expect(cameraAdjustmentTarget(null, null)).toBe('storage')
  })

  it('keeps drags on the slide when the deck or the slide configures the camera', () => {
    expect(cameraAdjustmentTarget(undefined, { size: 160 })).toBe('session')
    expect(cameraAdjustmentTarget({ position: 'top-left' }, {})).toBe('session')
  })
})

describe('clampCameraToWindow', () => {
  const windowSize = { width: 1920, height: 1080 }

  it('pulls the bubble back only when its top-left leaves the window', () => {
    expect(clampCameraToWindow(
      { x: 1920, y: 10, size: 100 },
      windowSize,
    )).toEqual({ x: 1920 - 100 - 30, y: 10, size: 100 })
  })

  it('leaves a bubble outside the slide but inside the window', () => {
    const outside = { x: -40, y: 1200, size: 80 }
    expect(clampCameraToWindow(outside, windowSize)).toEqual({
      x: -40,
      y: 1080 - 80 - 30,
      size: 80,
    })
  })
})

describe('projectCamera', () => {
  const rect = { left: 100, top: 50, width: 1960, height: 1102 }

  it('maps canvas pixels through the main slide box and back', () => {
    const placement = { x: 40, y: 40, size: 100 }
    const screen = { x: 180, y: 130, size: 200 }
    expect(projectCamera(placement, rect, canvas)).toEqual(screen)
    expect(unprojectCamera(screen, rect, canvas)).toEqual(placement)
  })

  it('maps a point left of the slide to a negative canvas position', () => {
    expect(unprojectCamera({ x: 60, y: 130, size: 200 }, rect, canvas)).toEqual({
      x: -20,
      y: 40,
      size: 100,
    })
  })

  it('leaves a screen placement unchanged when the slide box is empty', () => {
    const screen = { x: 10, y: 20, size: 30 }
    expect(unprojectCamera(screen, { left: 0, top: 0, width: 0, height: 0 }, canvas)).toEqual(screen)
  })
})
