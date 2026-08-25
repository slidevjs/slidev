import { describe, expect, it } from 'vitest'
import { isUsableDataUri } from './capture'

/**
 * `capture.ts` needs a live browser, so only its pure predicates are unit
 * tested here. This one guards a real failure: pptxgenjs answers a data URI it
 * cannot parse by printing to stderr and writing no picture at all, so the
 * image is missing and the export still reports success.
 */
describe('isUsableDataUri', () => {
  it('accepts a base64 raster', () => {
    expect(isUsableDataUri('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
    expect(isUsableDataUri('data:image/jpeg;base64,/9j/4AAQ')).toBe(true)
  })

  it('rejects a URL-encoded data URI, which is how inline SVG is usually written', () => {
    expect(isUsableDataUri('data:image/svg+xml,%3c!--%20icon%20--%3e')).toBe(false)
  })

  it('rejects SVG even when it is base64', () => {
    // pptxgenjs writes a broken raster fallback for SVG from Node, so these
    // are screenshotted rather than embedded.
    expect(isUsableDataUri('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false)
  })
})
