import { describe, expect, it } from 'vitest'
import {
  builtinCameraSize,
  cameraAdjustmentTarget,
  cameraAnchorPosition,
  clampCameraToViewport,
  resolveCamera,
} from './camera'

const viewport = { width: 1920, height: 1080 }

describe('resolveCamera', () => {
  it('falls back to the built-in bottom-right bubble', () => {
    const size = builtinCameraSize(viewport)
    expect(resolveCamera({ viewport })).toEqual({
      ...cameraAnchorPosition('bottom-right', viewport, size),
      size,
    })
  })

  it('uses the saved browser position when the deck has no camera config', () => {
    expect(resolveCamera({
      viewport,
      stored: { x: 12, y: 24, size: 100 },
    })).toEqual({ x: 12, y: 24, size: 100 })
  })

  it('applies a global anchor and size ahead of the saved position', () => {
    expect(resolveCamera({
      viewport,
      global: { position: 'bottom-left', size: 160 },
      stored: { x: 12, y: 24, size: 100 },
    })).toEqual({
      ...cameraAnchorPosition('bottom-left', viewport, 160),
      size: 160,
    })
  })

  it('accepts numeric coordinates and a named anchor in x', () => {
    expect(resolveCamera({
      viewport,
      global: { x: 40, y: 50, size: 200 },
    })).toEqual({ x: 40, y: 50, size: 200 })

    expect(resolveCamera({
      viewport,
      global: { x: 'top-right', size: 180 },
    })).toEqual({
      ...cameraAnchorPosition('top-right', viewport, 180),
      size: 180,
    })
  })

  it('lets a slide override individual fields', () => {
    expect(resolveCamera({
      viewport,
      global: { position: 'top-left', size: 200 },
      slide: { position: 'bottom-left' },
    })).toEqual({
      ...cameraAnchorPosition('bottom-left', viewport, 200),
      size: 200,
    })

    expect(resolveCamera({
      viewport,
      global: { x: 40, y: 50, size: 200 },
      slide: { size: 120 },
    })).toEqual({ x: 40, y: 50, size: 120 })

    expect(resolveCamera({
      viewport,
      global: { position: 'top-right', size: 200 },
      slide: { y: 80 },
    })).toEqual({
      x: cameraAnchorPosition('top-right', viewport, 200).x,
      y: 80,
      size: 200,
    })
  })

  it('prefers a session adjustment over frontmatter', () => {
    expect(resolveCamera({
      viewport,
      global: { position: 'top-left', size: 200 },
      slide: { position: 'bottom-left', size: 160 },
      session: { x: 300, y: 400, size: 90 },
    })).toEqual({ x: 300, y: 400, size: 90 })
  })

  it('ignores unknown anchors and clamps tiny sizes', () => {
    const size = builtinCameraSize(viewport)
    expect(resolveCamera({
      viewport,
      global: { position: 'middle' as 'top-left', size: 4 },
      stored: { x: 8, y: 9 },
    })).toEqual({ x: 8, y: 9, size: 10 })

    expect(resolveCamera({
      viewport,
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

describe('clampCameraToViewport', () => {
  it('pulls a bubble back inside the viewport', () => {
    expect(clampCameraToViewport(
      { x: 1920, y: 10, size: 100 },
      viewport,
    )).toEqual({ x: 1920 - 100 - 30, y: 10, size: 100 })
  })
})
