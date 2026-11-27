import type { EditableExportResult } from './index'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reportEditableExport } from './index'

const RESULT: EditableExportResult = {
  slideCount: 1,
  fallbackSlides: [],
  fontsNamed: [],
  imagesDropped: 0,
  isolationMissed: 0,
  rastersFailed: 0,
  unparsedColors: [],
  unplaceablePseudos: [],
  generatedContentPictures: 0,
  output: 'slides.pptx',
}

describe('reportEditableExport', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('says how many generated-content decorations became pictures', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reportEditableExport({ ...RESULT, generatedContentPictures: 2 })
    expect(warn.mock.calls.flat().join('\n')).toContain('2 CSS decoration(s) with generated content')
  })

  it('says nothing about them when none did', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reportEditableExport(RESULT)
    expect(warn).not.toHaveBeenCalled()
  })
})
