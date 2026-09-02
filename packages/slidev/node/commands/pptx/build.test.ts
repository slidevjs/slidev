import type { SlideIr } from './ir'
import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'
import { describe, expect, it } from 'vitest'
import { buildPptx } from './build'

/**
 * These assert on the generated OOXML, not on the JavaScript that produced it.
 *
 * That is deliberate: every bug this file exists to catch is a unit conversion,
 * and a unit conversion looks correct in the source right up until you read
 * what it wrote. `sz="2400"` is checkable against the spec; `pt(fontSize)` is
 * not.
 */

const BLACK = { r: 0, g: 0, b: 0, a: 1 }

function slide(nodes: SlideIr['nodes']): SlideIr {
  return { no: 1, clickIndex: 0, containerId: '001-01', size: { w: 980, h: 552 }, nodes }
}

async function slideXml(ir: SlideIr[]): Promise<string> {
  const buffer = await buildPptx(PptxGenJS, ir, { width: 980, height: 552 })
  const zip = await JSZip.loadAsync(buffer)
  return await zip.file('ppt/slides/slide1.xml')!.async('string')
}

function textNode(runs: SlideIr['nodes'][number] extends never ? never : any): any {
  return {
    kind: 'text',
    sourceId: 1,
    rect: { x: 0, y: 0, w: 200, h: 40 },
    elementRect: { x: 0, y: 0, w: 200, h: 40 },
    lineCount: 1,
    align: 'left',
    lineHeight: 40,
    runs,
  }
}

describe('unit conversions', () => {
  it('writes font size in points, not pixels', async () => {
    const xml = await slideXml([
      slide([textNode([{ text: 'Hello', fontSize: 32, fontFamily: 'Arial' }])]),
    ])
    // 32 CSS px at 96 px/in is 24 pt, and OOXML stores hundredths of a point.
    // Getting this wrong makes every deck a third too large.
    expect(xml).toContain('sz="2400"')
  })

  it('writes letter spacing in points and disables kerning', async () => {
    const xml = await slideXml([
      slide([textNode([{ text: 'WIDE', fontSize: 16, fontFamily: 'Arial', letterSpacing: 2 }])]),
    ])
    // 2px -> 1.5pt -> spc is hundredths of a point.
    expect(xml).toContain('spc="150"')
    expect(xml).toContain('kern="0"')
  })

  it('places geometry at exactly 9525 EMU per pixel', async () => {
    const xml = await slideXml([
      slide([{
        kind: 'box',
        sourceId: 1,
        rect: { x: 100, y: 50, w: 200, h: 25 },
        fill: BLACK,
      }]),
    ])
    // Integer EMU throughout, so there is no rounding drift to chase later.
    expect(xml).toContain('x="952500"') // 100 * 9525
    expect(xml).toContain('y="476250"') // 50 * 9525
    expect(xml).toContain('cx="1905000"') // 200 * 9525
    expect(xml).toContain('cy="238125"') // 25 * 9525
  })

  it('writes a corner radius that is not zero', async () => {
    const xml = await slideXml([
      slide([{
        kind: 'box',
        sourceId: 1,
        rect: { x: 0, y: 0, w: 200, h: 100 },
        fill: BLACK,
        radius: 12,
      }]),
    ])
    expect(xml).toContain('prst="roundRect"')
    // OOXML states the corner adjustment as hundred-thousandths of the shorter
    // side. 12px of a 100px side is 12%, so exactly 12000.
    //
    // Asserted exactly, not as "greater than zero": `rectRadius` is documented
    // as a 0.0-1.0 fraction but is really inches, and the wrong reading still
    // produces a non-zero adjustment (11520 here). A loose assertion passes on
    // both and pins nothing, which is what this test caught the first time.
    expect(xml).toContain('<a:gd name="adj" fmla="val 12000"/>')
  })
})

describe('fills and borders', () => {
  it('maps alpha to transparency', async () => {
    const xml = await slideXml([
      slide([{
        kind: 'box',
        sourceId: 1,
        rect: { x: 0, y: 0, w: 10, h: 10 },
        fill: { r: 255, g: 0, b: 0, a: 0.6 },
      }]),
    ])
    // 0.6 opacity is 40% transparent, and OOXML alpha is the inverse again,
    // in thousandths of a percent.
    expect(xml).toContain('<a:alpha val="60000"/>')
  })

  it('emits no alpha element for an opaque fill', async () => {
    const xml = await slideXml([
      slide([{ kind: 'box', sourceId: 1, rect: { x: 0, y: 0, w: 10, h: 10 }, fill: BLACK }]),
    ])
    expect(xml).not.toContain('<a:alpha')
  })

  it('uses one uniform line when all four borders match', async () => {
    const border = { width: 2, color: BLACK, style: 'solid' as const }
    const xml = await slideXml([
      slide([{
        kind: 'box',
        sourceId: 1,
        rect: { x: 0, y: 0, w: 100, h: 100 },
        borders: [border, border, border, border],
      }]),
    ])
    // One shape, not five.
    expect(xml.match(/<p:sp>/g)).toHaveLength(1)
  })

  it('splits differing borders into one rectangle per side', async () => {
    const thick = { width: 4, color: BLACK, style: 'solid' as const }
    const xml = await slideXml([
      slide([{
        kind: 'box',
        sourceId: 1,
        rect: { x: 0, y: 0, w: 100, h: 100 },
        borders: [thick, undefined, undefined, undefined],
      }]),
    ])
    // Just the edge. pptxgenjs gives a shape a single uniform border, so a
    // left-accent bar or a single top rule has to be its own rectangle, and
    // the box that would have carried it has neither fill nor border left to
    // draw. Emitting it anyway left PowerPoint to resolve a shape with no fill
    // and no outline from its default style.
    expect(xml.match(/<p:sp>/g)).toHaveLength(1)
    expect(xml).toContain('cy="38100"') // the 4px edge: 4 * 9525
  })
})

describe('text', () => {
  it('emits a real line break for a soft break, not a vertical tab', async () => {
    const xml = await slideXml([
      slide([textNode([
        { text: 'first', fontSize: 16, fontFamily: 'Arial' },
        { text: 'second', fontSize: 16, fontFamily: 'Arial', breakBefore: true },
      ])]),
    ])
    expect(xml).toContain('<a:br/>')
    expect(xml).not.toContain('\v')
  })

  it('keeps the midpoint of a centered line when adding slack', async () => {
    const centered = { ...textNode([{ text: 'x', fontSize: 16, fontFamily: 'Arial' }]), align: 'center' }
    const xml = await slideXml([slide([centered])])
    // The box is widened by 12px so PowerPoint's wider metrics do not force a
    // wrap, so its origin moves left by half of that to hold the center still.
    expect(xml).toContain('x="-57150"') // -6 * 9525
    expect(xml).toContain('cx="2019300"') // 212 * 9525
  })

  it('turns off wrapping for a single line and on for several', async () => {
    const one = await slideXml([slide([textNode([{ text: 'x', fontSize: 16, fontFamily: 'Arial' }])])])
    expect(one).toContain('wrap="none"')

    const many = await slideXml([
      slide([{ ...textNode([{ text: 'x', fontSize: 16, fontFamily: 'Arial' }]), lineCount: 3 }]),
    ])
    expect(many).not.toContain('wrap="none"')
  })
})

describe('slide assembly', () => {
  it('writes notes into the notes slide', async () => {
    const buffer = await buildPptx(
      PptxGenJS,
      [{ ...slide([]), note: 'Say this part out loud.' }],
      { width: 980, height: 552 },
    )
    const zip = await JSZip.loadAsync(buffer)
    const notes = await zip.file('ppt/notesSlides/notesSlide1.xml')!.async('string')
    expect(notes).toContain('Say this part out loud.')
  })

  it('falls back to a background picture and draws nothing else', async () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const xml = await slideXml([{
      ...slide([{ kind: 'box', sourceId: 1, rect: { x: 0, y: 0, w: 10, h: 10 }, fill: BLACK }]),
      fallbackPng: png,
      fallbackReason: 'walker timed out',
    }])
    // The safety valve has to be exclusive. Drawing the shapes as well would
    // put half-measured content on top of a correct picture of the same thing.
    expect(xml).not.toContain('<p:sp>')
  })

  it('produces a non-empty shape tree, which the image exporter never does', async () => {
    const xml = await slideXml([
      slide([textNode([{ text: 'Selectable', fontSize: 16, fontFamily: 'Arial' }])]),
    ])
    expect(xml).toContain('<a:t>Selectable</a:t>')
  })
})

describe('a hyperlink is not underlined unless CSS says so', () => {
  it('suppresses the underline pptxgenjs adds to every link', async () => {
    // pptxgenjs writes `u="sng"` for any run carrying a hyperlink unless
    // `underline` is set. Slidev's own themes rule links with a dashed
    // `border-bottom`, which is already drawn as its own shape, so the deck
    // came out with two lines under every link.
    const xml = await slideXml([
      slide([textNode([{ text: 'Documentation', fontSize: 16, fontFamily: 'Arial', link: 'https://sli.dev' }])]),
    ])
    expect(xml).toContain('u="none"')
    expect(xml).not.toContain('u="sng"')
  })

  it('still underlines a run whose CSS asks for it', async () => {
    const xml = await slideXml([
      slide([textNode([{ text: 'Documentation', fontSize: 16, fontFamily: 'Arial', link: 'https://sli.dev', underline: true }])]),
    ])
    expect(xml).toContain('u="sng"')
  })
})

describe('a dashed border keeps its dashes', () => {
  const dashed = { width: 1, color: BLACK, style: 'dashed' as const }

  it('draws a dashed edge as a line, not a filled bar', async () => {
    // A filled rectangle cannot carry a dash pattern. Slidev rules its links
    // with `border-bottom: 1px dashed`, so every link in a deck came out with
    // a solid bar under it.
    const xml = await slideXml([
      slide([{
        kind: 'box',
        sourceId: 1,
        rect: { x: 0, y: 0, w: 100, h: 20 },
        borders: [undefined, undefined, dashed, undefined],
      }]),
    ])
    expect(xml).toContain('<a:prstDash val="dash"/>')
    expect(xml).toContain('prst="line"')
  })

  it('leaves a solid edge as a filled bar', async () => {
    const xml = await slideXml([
      slide([{
        kind: 'box',
        sourceId: 1,
        rect: { x: 0, y: 0, w: 100, h: 20 },
        borders: [undefined, undefined, { width: 1, color: BLACK, style: 'solid' as const }, undefined],
      }]),
    ])
    expect(xml).not.toContain('prst="line"')
  })
})

describe('a fill is stated, never inherited', () => {
  it('writes an explicit noFill for a shape that has none', async () => {
    // pptxgenjs writes `<a:noFill/>` for an ABSENT fill and nothing at all for
    // `{ type: 'none' }`, so the explicit-looking version was the one that
    // inherited the default shape style.
    const xml = await slideXml([
      slide([{
        kind: 'box',
        sourceId: 1,
        rect: { x: 0, y: 0, w: 100, h: 100 },
        borders: [
          { width: 1, color: BLACK, style: 'solid' as const },
          { width: 1, color: BLACK, style: 'solid' as const },
          { width: 1, color: BLACK, style: 'solid' as const },
          { width: 1, color: BLACK, style: 'solid' as const },
        ],
      }]),
    ])
    expect(xml).toContain('<a:noFill/>')
  })
})
