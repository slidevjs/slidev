import { describe, expect, it } from 'vitest'
import { resolveHandoutOptions } from '../packages/parser/src/config'

describe('handout config', () => {
  it('resolves default handout options', () => {
    const options = resolveHandoutOptions()

    expect(options).toMatchObject({
      size: 'A4',
      orientation: 'portrait',
      widthMm: 210,
      heightMm: 297,
      cssPageSize: 'A4',
      margins: { top: '0cm', right: '0cm', bottom: '0cm', left: '0cm' },
      coverMargins: { top: '1cm', right: '1.5cm', bottom: '1cm', left: '1.5cm' },
    })
  })

  it('resolves preset size with orientation and partial margins', () => {
    const options = resolveHandoutOptions({
      size: 'letter',
      orientation: 'landscape',
      margins: {
        top: '0.5in',
        bottom: '0.5in',
      },
    })

    expect(options).toMatchObject({
      size: 'letter',
      orientation: 'landscape',
      widthMm: 279.4,
      heightMm: 215.9,
      cssPageSize: 'letter landscape',
      margins: {
        top: '0.5in',
        right: '0cm',
        bottom: '0.5in',
        left: '0cm',
      },
    })
  })

  it('resolves custom dimensions and applies custom cover margins', () => {
    const options = resolveHandoutOptions({
      width: 8.5,
      height: 11,
      unit: 'in',
      orientation: 'landscape',
      coverMargins: '2cm',
    })

    expect(options).toMatchObject({
      size: 'custom',
      orientation: 'landscape',
      widthMm: 279.4,
      cssPageSize: '279.4mm 215.9mm',
      coverMargins: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm',
      },
    })
    expect(options.heightMm).toBeCloseTo(215.9, 5)
  })
})
