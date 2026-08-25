import type { IrBox, IrText, RawNode, RawSlide, RawSnapshot, RawStyle } from './ir'
import { describe, expect, it } from 'vitest'
import { normalize, parseColor, parseLength, parseShadow, rasterReasonFor } from './normalize'

/**
 * One named case per trap.
 *
 * Every one of these is a bug that already shipped in the Python
 * implementation this was ported from, or one found by reading Slidev's own
 * `demo/starter`. A rule without a case here is a rule nobody will remember
 * the reason for in six months.
 */

const BASE_STYLE: RawStyle = {
  display: 'block',
  position: 'static',
  zIndex: 'auto',
  visibility: 'visible',
  opacity: '1',
  color: 'rgb(0, 0, 0)',
  backgroundColor: 'rgba(0, 0, 0, 0)',
  backgroundImage: 'none',
  fontFamily: 'Inter, sans-serif',
  fontSize: '16px',
  fontWeight: '400',
  fontStyle: 'normal',
  textAlign: 'start',
  textDecorationLine: 'none',
  textTransform: 'none',
  letterSpacing: 'normal',
  lineHeight: 'normal',
  whiteSpace: 'normal',
  paddingLeft: '0px',
  paddingRight: '0px',
  borderTopWidth: '0px',
  borderTopStyle: 'none',
  borderTopColor: 'rgb(0, 0, 0)',
  borderRightWidth: '0px',
  borderRightStyle: 'none',
  borderRightColor: 'rgb(0, 0, 0)',
  borderBottomWidth: '0px',
  borderBottomStyle: 'none',
  borderBottomColor: 'rgb(0, 0, 0)',
  borderLeftWidth: '0px',
  borderLeftStyle: 'none',
  borderLeftColor: 'rgb(0, 0, 0)',
  borderTopLeftRadius: '0px',
  boxShadow: 'none',
  filter: 'none',
  backdropFilter: 'none',
  mixBlendMode: 'normal',
  clipPath: 'none',
  transform: 'none',
  writingMode: 'horizontal-tb',
  webkitBackgroundClip: 'border-box',
  overflow: 'visible',
  top: 'auto',
  right: 'auto',
  bottom: 'auto',
  left: 'auto',
  width: 'auto',
  height: 'auto',
}

function style(overrides: Partial<RawStyle> = {}): RawStyle {
  return { ...BASE_STYLE, ...overrides }
}

const RECT = { x: 0, y: 0, w: 100, h: 20 }

function el(id: number, parent: number, tag: string, styleIndex: number, extra: Partial<RawNode> = {}): RawNode {
  return { id, parent, tag, style: styleIndex, rect: RECT, ...extra }
}

function text(id: number, parent: number, value: string, extra: Partial<RawNode> = {}): RawNode {
  return {
    id,
    parent,
    tag: '#text',
    style: -1,
    rect: RECT,
    text: value,
    glyphRects: [RECT],
    ...extra,
  }
}

function snapshot(nodes: RawNode[], styles: RawStyle[]): RawSnapshot {
  const slide: RawSlide = { no: 1, clickIndex: 0, containerId: '001-01', size: { w: 980, h: 552 }, nodes }
  return { slides: [slide], styles, fontResolution: { 'Inter, sans-serif': 'Inter' }, unplaceablePseudos: [] }
}

function run(nodes: RawNode[], styles: RawStyle[]) {
  return normalize(snapshot(nodes, styles), { notes: new Map() })
}

function texts(nodes: any[]): IrText[] {
  return nodes.filter(n => n.kind === 'text')
}

function boxes(nodes: any[]): IrBox[] {
  return nodes.filter(n => n.kind === 'box')
}

describe('value parsing', () => {
  it('reads rgb and rgba', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColor('rgba(0, 0, 0, 0.5)')).toEqual({ r: 0, g: 0, b: 0, a: 0.5 })
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 })
    expect(parseColor(undefined)).toBeUndefined()
  })

  it('reads the modern colour syntaxes Chromium leaves in computed values', () => {
    // A theme authored in modern syntax keeps these in the computed value.
    // Returning undefined for them dropped every fill and text colour on the
    // slide with nothing in the log to explain it.
    const red = parseColor('oklch(0.628 0.2577 29.23)')!
    expect(red.r).toBeGreaterThan(248)
    expect(red.g).toBeLessThan(8)
    expect(red.b).toBeLessThan(8)

    expect(parseColor('hsl(120, 100%, 50%)')).toEqual({ r: 0, g: 255, b: 0, a: 1 })
    expect(parseColor('color(srgb 1 0 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('reports a colour it cannot read instead of failing silently', () => {
    const bad = style({ backgroundColor: 'lab(50% 40 59.5)' })
    const { unparsedColors } = run([el(0, -1, 'DIV', 1)], [BASE_STYLE, bad])
    expect(unparsedColors).toContain('lab(50% 40 59.5)')
    // Per run, not module state: a drained global leaks into the next export
    // whenever this one throws before the caller collects it.
    expect(run([el(0, -1, 'DIV', 0)], [BASE_STYLE]).unparsedColors).toHaveLength(0)
  })

  it('reads a pixel length, and a percentage against its basis', () => {
    expect(parseLength('12.5px')).toBe(12.5)
    expect(parseLength('normal')).toBe(0)
    // Chromium keeps border-radius as a percentage rather than resolving it, so
    // `parseFloat` alone turned `50%` on a 200px box into 50px.
    expect(parseLength('50%', 200)).toBe(100)
  })

  it('reads a box-shadow into PowerPoint polar form', () => {
    const shadow = parseShadow('rgba(0, 0, 0, 0.5) 0px 4px 8px 0px')!
    expect(shadow.blur).toBe(8)
    expect(shadow.offset).toBe(4)
    expect(shadow.angle).toBe(90)
    expect(shadow.color.a).toBe(0.5)
    // No DrawingML equivalent for either of these.
    expect(parseShadow('none')).toBeUndefined()
    expect(parseShadow('rgb(0, 0, 0) 0px 2px 4px inset')).toBeUndefined()
  })
})

describe('finding 2: <br> becomes a real line break', () => {
  it('breaks between the runs either side of it', () => {
    const nodes = [
      el(0, -1, 'DIV', 0),
      text(1, 0, 'line one'),
      el(2, 0, 'BR', 1),
      text(3, 0, 'line two'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, style({ display: 'inline' })])
    const out = texts(slides[0].nodes)[0]
    // Without this the two runs are concatenated and export as "line oneline two".
    expect(out.runs.map(r => r.text)).toEqual(['line one', 'line two'])
    expect(out.runs[1].breakBefore).toBe(true)
    expect(out.runs[0].breakBefore).toBeUndefined()
  })
})

describe('code blocks keep their line structure', () => {
  it('turns a pre newline into a real line break', () => {
    const pre = style({ whiteSpace: 'pre' })
    const inline = style({ display: 'inline', whiteSpace: 'pre' })
    const nodes = [
      el(0, -1, 'PRE', 1),
      el(1, 0, 'SPAN', 2),
      text(2, 1, 'const a = 1'),
      // Shiki separates its line spans with a bare newline text node, which
      // has no client rects of its own.
      text(3, 0, '\n', { glyphRects: [] }),
      el(4, 0, 'SPAN', 2),
      text(5, 4, 'const b = 2'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, pre, inline])
    const out = texts(slides[0].nodes)[0]
    // Folded to a space, every multi-line code block exported as one
    // re-wrapped paragraph, which is core content for a developer slide tool.
    expect(out.runs.map(r => r.text)).toEqual(['const a = 1', 'const b = 2'])
    expect(out.runs[1].breakBefore).toBe(true)
  })

  it('keeps a blank line between two consecutive breaks', () => {
    const inline = style({ display: 'inline' })
    const nodes = [
      el(0, -1, 'DIV', 0),
      text(1, 0, 'first'),
      el(2, 0, 'BR', 1),
      el(3, 0, 'BR', 1),
      text(4, 0, 'second'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, inline])
    const out = texts(slides[0].nodes)[0]
    // `softBreakBefore` is one break per run, so two in a row need an empty
    // run between them or the blank line silently disappears.
    expect(out.runs).toHaveLength(3)
    expect(out.runs[1].text).toBe('')
    expect(out.runs[1].breakBefore).toBe(true)
    expect(out.runs[2].breakBefore).toBe(true)
  })

  it('does not open a box with a leading break', () => {
    const inline = style({ display: 'inline' })
    const nodes = [el(0, -1, 'DIV', 0), el(1, 0, 'BR', 1), text(2, 0, 'text')]
    const { slides } = run(nodes, [BASE_STYLE, inline])
    expect(texts(slides[0].nodes)[0].runs[0].breakBefore).toBeUndefined()
  })
})

describe('finding 4: an inline image survives', () => {
  it('draws an <img> that sits inside a line of text', () => {
    const inline = style({ display: 'inline' })
    const nodes = [
      el(0, -1, 'P', 0),
      text(1, 0, 'before'),
      el(2, 0, 'IMG', 1, { src: 'data:image/png;base64,AAAA', alt: 'logo' }),
    ]
    const { slides } = run(nodes, [BASE_STYLE, inline])
    // Inline children go to the text grouper, which finds no text under an
    // IMG, so the image used to vanish from the slide entirely.
    const images = slides[0].nodes.filter(n => n.kind === 'image')
    expect(images).toHaveLength(1)
    expect((images[0] as any).alt).toBe('logo')
  })
})

describe('finding 11: the space between inline elements', () => {
  it('keeps a whitespace-only node between two spans', () => {
    const inline = style({ display: 'inline' })
    const nodes = [
      el(0, -1, 'DIV', 0),
      el(1, 0, 'SPAN', 1),
      text(2, 1, 'Hello'),
      text(3, 0, ' '),
      el(4, 0, 'SPAN', 1),
      text(5, 4, 'World'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, inline])
    const out = texts(slides[0].nodes)[0]
    // Dropping it exported "HelloWorld".
    expect(out.runs.map(r => r.text).join('')).toBe('Hello World')
  })
})

describe('finding 7: inline-level layout containers still lay out', () => {
  it('does not merge the cells of an inline-flex badge', () => {
    const badge = style({ display: 'inline-flex' })
    const cell = style({ display: 'inline' })
    const nodes = [
      el(0, -1, 'DIV', 0),
      el(1, 0, 'SPAN', 1),
      el(2, 1, 'SPAN', 2),
      text(3, 2, 'Left cell'),
      el(4, 1, 'SPAN', 2),
      text(5, 4, 'Right cell'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, badge, cell])
    // `^inline` matched inline-flex, so the walk descended and concatenated
    // the cells: the trap-3 bug one display value over.
    const out = texts(slides[0].nodes)
    expect(out).toHaveLength(2)
    expect(out.map(t => t.runs[0].text)).toEqual(['Left cell', 'Right cell'])
  })
})

describe('finding 8: a list item flows its children as text', () => {
  it('keeps a bold lead-in joined inside an <li>', () => {
    const item = style({ display: 'list-item' })
    const inline = style({ display: 'inline' })
    const nodes = [
      el(0, -1, 'LI', 1, { marker: '\u2022 ' }),
      text(1, 0, 'plain '),
      el(2, 0, 'B', 2),
      text(3, 2, 'bold'),
      text(4, 0, ' tail'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, item, inline])
    const out = texts(slides[0].nodes)
    // One marker box plus ONE grouped paragraph. Treating `list-item` as a
    // layout container fragmented this into four boxes.
    expect(out).toHaveLength(2)
    expect(out[1].runs.map(r => r.text)).toEqual(['plain ', 'bold', ' tail'])
  })
})

describe('finding 15: element opacity reaches the fill', () => {
  it('folds opacity into the colour alpha', () => {
    const faded = style({ backgroundColor: 'rgb(0, 0, 0)' })
    // Carried on the NODE, compounded down the tree by the walker, because CSS
    // opacity does not inherit and DrawingML has no group opacity to stand in
    // for a half-transparent wrapper.
    const nodes = [el(0, -1, 'DIV', 1, { opacity: 0.5 })]
    const { slides } = run(nodes, [BASE_STYLE, faded])
    // DrawingML has no element opacity, only per-fill alpha, so a half
    // transparent overlay exported fully opaque and hid what was behind it.
    expect(boxes(slides[0].nodes)[0].fill).toEqual({ r: 0, g: 0, b: 0, a: 0.5 })
  })
})

describe('paint order follows CSS, not the document', () => {
  it('draws a positioned element above in-flow content that comes later', () => {
    const positioned = style({ position: 'absolute' })
    const backdrop = style({ backgroundImage: 'url(/img/scenery.png)' })
    const corner = { x: 900, y: 10, w: 60, h: 20 }
    const nodes = [
      // A slide's page counter is the FIRST child of its container, and it is
      // a positioned <footer> wrapping a plain <div>, so the layer has to come
      // from the nearest POSITIONED ancestor rather than the nearest styled one.
      el(0, -1, 'FOOTER', 1, { rect: corner }),
      el(1, 0, 'DIV', 0, { rect: corner }),
      text(2, 1, '3 / 35', { rect: corner, glyphRects: [corner] }),
      // The full-bleed background comes after it in the tree, so array order
      // painted it straight over the counter and the counter vanished.
      el(3, -1, 'DIV', 2, { rect: { x: 0, y: 0, w: 980, h: 552 } }),
    ]
    const { slides } = run(nodes, [BASE_STYLE, positioned, backdrop])
    const kinds = slides[0].nodes.map(n => n.kind)
    expect(kinds.indexOf('raster')).toBeLessThan(kinds.indexOf('text'))
  })

  it('keeps document order within one layer', () => {
    const nodes = [
      el(0, -1, 'DIV', 1),
      text(1, 0, 'first'),
      el(2, -1, 'DIV', 1),
      text(3, 2, 'second'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, style({ backgroundColor: 'rgb(1, 2, 3)' })])
    const out = texts(slides[0].nodes)
    expect(out.map(t => t.runs[0].text)).toEqual(['first', 'second'])
  })
})

describe('opacity reaches text, not only shapes', () => {
  it('greys a paragraph that its ancestor dimmed', () => {
    // Slidev's own stylesheet greys this kind of paragraph with `opacity: 0.5`
    // rather than a colour. Opacity is compounded down the tree onto elements,
    // but a text node has no style of its own, so every run lost it and the
    // paragraph exported solid black.
    const nodes = [
      el(0, -1, 'P', 0, { opacity: 0.5 }),
      text(1, 0, 'a dimmed paragraph', { opacity: 0.5 }),
    ]
    const { slides } = run(nodes, [BASE_STYLE])
    expect(texts(slides[0].nodes)[0].runs[0].color).toEqual({ r: 0, g: 0, b: 0, a: 0.5 })
  })

  it('centres a list marker on its line rather than above it', () => {
    const item = style({ display: 'list-item' })
    const { slides } = run([el(0, -1, 'LI', 1, { marker: '\u25AA ' })], [BASE_STYLE, item])
    expect(texts(slides[0].nodes)[0].valign).toBe('middle')
  })
})

describe('finding 6: the slide keeps its own background', () => {
  it('carries the container background into the IR', () => {
    const raw = snapshot([el(0, -1, 'DIV', 0)], [BASE_STYLE])
    raw.slides[0].background = 'rgb(18, 18, 18)'
    const { slides } = normalize(raw, { notes: new Map() })
    // The walk starts at the container's children, so without this every slide
    // exported onto PowerPoint's white and a dark theme became unreadable.
    expect(slides[0].background).toEqual({ r: 18, g: 18, b: 18, a: 1 })
  })
})

describe('a shrink-wrapped container leaves no room to wrap', () => {
  it('widens a centred block whose container is exactly its ink', () => {
    const centred = style({ textAlign: 'center' })
    // The container fits the text exactly, which is what a centred statement
    // block does. PowerPoint sets the same string slightly wider than
    // Chromium, so with no headroom the longest line wraps and the block
    // gains a line.
    const box = { x: 155, y: 192, w: 487, h: 90 }
    const nodes = [
      el(0, -1, 'DIV', 1, { rect: box }),
      text(1, 0, 'a long centred statement', {
        rect: box,
        glyphRects: [
          { x: 155, y: 192, w: 400, h: 30 },
          { x: 155, y: 222, w: 487, h: 30 },
          { x: 155, y: 252, w: 380, h: 30 },
        ],
      }),
    ]
    const { slides } = run(nodes, [BASE_STYLE, centred])
    const out = texts(slides[0].nodes)[0]
    expect(out.rect.w).toBeGreaterThan(487)
    // Grown about the centre, so the text does not slide sideways.
    expect(out.rect.x + out.rect.w / 2).toBeCloseTo(155 + 487 / 2, 5)
  })

  it('leaves a column-constrained paragraph at its container width', () => {
    const nodes = [
      el(0, -1, 'DIV', 0, { rect: { x: 0, y: 0, w: 400, h: 60 } }),
      text(1, 0, 'wrapped body copy', {
        rect: { x: 0, y: 0, w: 400, h: 60 },
        glyphRects: [
          { x: 0, y: 0, w: 380, h: 20 },
          { x: 0, y: 24, w: 200, h: 20 },
        ],
      }),
    ]
    const { slides } = run(nodes, [BASE_STYLE])
    // 20px of headroom is already more than the 2% this needs, so widening it
    // would push the text into whatever sits beside it.
    expect(texts(slides[0].nodes)[0].rect.w).toBe(400)
  })
})

describe('trap 16: --range is applied by the caller, not the page', () => {
  it('exposes the slide number so out-of-range slides can be filtered', () => {
    // The print route renders EVERY slide whatever the `range` query says, so
    // out-of-range containers are fully laid out rather than hidden, and an
    // exporter that trusts the page exports the whole deck. `no` and
    // `containerId` are what let the caller drop them, the same way the image
    // exporter does with `pages.includes(slideNo)`.
    const raw = snapshot([el(0, -1, 'DIV', 0), text(1, 0, 'content')], [BASE_STYLE])
    raw.slides[0].no = 7
    raw.slides[0].containerId = '007-03'
    const { slides } = normalize(raw, { notes: new Map() })
    expect(slides[0].no).toBe(7)
    expect(slides[0].containerId).toBe('007-03')
  })
})

describe('cSS pseudo-element decorations', () => {
  it('draws an ::after that paints a background image', () => {
    const mark = style({
      position: 'absolute',
      backgroundImage: 'url(/img/logo.png)',
      width: '84px',
      height: '33px',
    })
    const rect = { x: 858, y: 493, w: 84, h: 33 }
    const nodes = [
      el(0, -1, 'DIV', 0),
      el(1, 0, '::AFTER', 1, { rect, pageRect: rect }),
    ]
    const { slides, rasterRequests } = run(nodes, [BASE_STYLE, mark])
    // A pseudo-element has no DOM node, so a walk over the tree cannot see it.
    // A corporate logo drawn this way was silently absent from every slide.
    const raster = slides[0].nodes.find(n => n.kind === 'raster') as any
    expect(raster).toBeDefined()
    expect(raster.rect).toEqual(rect)
    // And no locator can point at it, so the capture clips the page instead.
    expect(rasterRequests[0].clip).toEqual(rect)
  })

  it('draws an ::before that paints a string', () => {
    const quote = style({ position: 'absolute', width: '20px', height: '20px' })
    const rect = { x: 10, y: 10, w: 20, h: 20 }
    const nodes = [
      el(0, -1, 'DIV', 0),
      el(1, 0, '::BEFORE', 1, { rect, pageRect: rect, text: '\u201C' }),
    ]
    const { slides } = run(nodes, [BASE_STYLE, quote])
    expect(texts(slides[0].nodes)[0].runs[0].text).toBe('\u201C')
  })
})

describe('finding 20: line counting tolerates sub-pixel layout', () => {
  it('treats fragments a fraction of a pixel apart as one line', () => {
    const nodes = [
      el(0, -1, 'DIV', 0),
      text(1, 0, 'one visual line', {
        glyphRects: [
          { x: 0, y: 10.4, w: 50, h: 20 },
          { x: 50, y: 10.6, w: 50, h: 20 },
        ],
      }),
    ]
    const { slides } = run(nodes, [BASE_STYLE])
    // Rounding put these on 10 and 11 and reported two lines, which flips
    // `wrap` in the builder, the one decision this number exists to make.
    expect(texts(slides[0].nodes)[0].lineCount).toBe(1)
  })
})

describe('trap 3: layout containers are not text blocks', () => {
  it('keeps grid cells apart instead of concatenating them', () => {
    const grid = style({ display: 'grid' })
    // The cells are INLINE on purpose. CSS blockifies the children of a grid
    // container into grid items whatever their specified display says, so they
    // are separate boxes. An earlier fixture used block children, which fall
    // into separate text groups anyway, so it passed even with the rule
    // disabled and tested nothing.
    const cell = style({ display: 'inline' })
    const nodes = [
      el(0, -1, 'DIV', 1),
      el(1, 0, 'SPAN', 2),
      text(2, 1, 'Left cell'),
      el(3, 0, 'SPAN', 2),
      text(4, 3, 'Right cell'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, grid, cell])
    const out = texts(slides[0].nodes)
    // The original bug produced one run reading "Left cellRight cell".
    expect(out).toHaveLength(2)
    expect(out[0].runs[0].text).toBe('Left cell')
    expect(out[1].runs[0].text).toBe('Right cell')
  })
})

describe('trap 7: consecutive inline nodes are one anonymous block', () => {
  it('joins a bold lead-in with the rest of its sentence', () => {
    const inline = style({ display: 'inline' })
    const bold = style({ display: 'inline', fontWeight: '700' })
    const nodes = [
      el(0, -1, 'DIV', 0),
      el(1, 0, 'B', 2),
      text(2, 1, 'A bold lead-in'),
      text(3, 0, ', and the rest of the sentence'),
      el(4, 0, 'DIV', 0),
      text(5, 4, 'A following block.'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, inline, bold])
    const out = texts(slides[0].nodes)
    // Two boxes: the anonymous block, then the nested block. Emitting three
    // separate shapes made the bold lead-in and the tail lay out from the same
    // origin and print on top of each other.
    expect(out).toHaveLength(2)
    expect(out[0].runs.map(r => r.text)).toEqual(['A bold lead-in', ', and the rest of the sentence'])
    expect(out[0].runs[0].bold).toBe(true)
    expect(out[0].runs[1].bold).toBeUndefined()
    expect(out[1].runs[0].text).toBe('A following block.')
  })
})

describe('trap 8: inline decorations paint before their text', () => {
  it('emits a chip background ahead of the white label on it', () => {
    const chip = style({ display: 'inline', backgroundColor: 'rgb(0, 128, 0)', color: 'rgb(255, 255, 255)' })
    const nodes = [
      el(0, -1, 'DIV', 0),
      el(1, 0, 'SPAN', 1),
      text(2, 1, 'NEW'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, chip])
    const kinds = slides[0].nodes.map(n => n.kind)
    // Paint order is array order. Emitted after the text, the chip covers its
    // own label and white-on-green becomes white-on-white.
    expect(kinds.indexOf('box')).toBeLessThan(kinds.indexOf('text'))
    expect(boxes(slides[0].nodes)[0].fill).toEqual({ r: 0, g: 128, b: 0, a: 1 })
  })

  it('anchors a chip label in its own box so it cannot drift off the chip', () => {
    const inline = style({ display: 'inline' })
    const chip = style({ display: 'inline', backgroundColor: 'rgb(0, 128, 0)' })
    const label = { x: 122, y: 0, w: 30, h: 20 }
    const nodes = [
      el(0, -1, 'DIV', 0),
      el(1, 0, 'SPAN', 2, { rect: label }),
      text(2, 1, 'NEW', { rect: label, glyphRects: [label] }),
    ]
    const { slides } = run(nodes, [BASE_STYLE, inline, chip])
    const out = texts(slides[0].nodes)
    // The chip's background is an absolutely positioned shape while the text
    // around it flows, so sharing one box lets PowerPoint's metrics
    // accumulate across the earlier runs and slide the label off its chip.
    expect(out).toHaveLength(1)
    expect(out[0].runs[0].text).toBe('NEW')
    // Pinned to the chip and centred in it, not to its own ink. However much
    // wider PowerPoint sets the string than the browser did, the label stays
    // evenly inset instead of ending up hard against one edge.
    expect(out[0].rect).toEqual(label)
    expect(out[0].align).toBe('center')
    expect(out[0].valign).toBe('middle')
  })

  it('leaves inline code in the middle of a sentence alone', () => {
    const inline = style({ display: 'inline' })
    const code = style({ display: 'inline', backgroundColor: 'rgb(240, 240, 240)' })
    const nodes = [
      el(0, -1, 'P', 0),
      text(1, 0, 'Use '),
      el(2, 0, 'CODE', 2),
      text(3, 2, 'npm i'),
      text(4, 0, ' to begin.'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, inline, code])
    // Slidev gives inline code a background, so an unconditional chip split
    // cut ordinary sentences into three boxes and centred the code span; when
    // such a sentence wrapped, the halves overlapped. A chip is a label on its
    // own, not a word in the middle of a line.
    const out = texts(slides[0].nodes)
    expect(out).toHaveLength(1)
    expect(out[0].runs.map(r => r.text)).toEqual(['Use ', 'npm i', ' to begin.'])
  })
})

describe('trap 2: text-transform and letter-spacing are applied', () => {
  it('uppercases the run rather than trusting PowerPoint to do it', () => {
    const label = style({ textTransform: 'uppercase', letterSpacing: '2px' })
    const nodes = [el(0, -1, 'DIV', 1), text(1, 0, 'section one')]
    const { slides } = run(nodes, [BASE_STYLE, label])
    const out = texts(slides[0].nodes)[0]
    // PowerPoint has no text-transform, so an untransformed run exports the
    // lower-case source text and the slide silently changes.
    expect(out.runs[0].text).toBe('SECTION ONE')
    expect(out.runs[0].letterSpacing).toBe(2)
  })
})

describe('trap 6: text is positioned from glyph bounds', () => {
  it('uses the glyph rects for a single line, not the element box', () => {
    const nodes = [
      el(0, -1, 'DIV', 0, { rect: { x: 0, y: 0, w: 500, h: 100 } }),
      text(1, 0, 'one line', {
        rect: { x: 0, y: 0, w: 500, h: 100 },
        glyphRects: [{ x: 40, y: 10, w: 120, h: 20 }],
      }),
    ]
    const { slides } = run(nodes, [BASE_STYLE])
    const out = texts(slides[0].nodes)[0]
    // Positioning from the element rect offsets the text by the container's
    // padding, and its width bears no relation to the ink.
    expect(out.rect).toEqual({ x: 40, y: 10, w: 120, h: 20 })
    expect(out.lineCount).toBe(1)
  })

  it('wraps multi-line text against the container content box', () => {
    const padded = style({ paddingLeft: '8px', paddingRight: '8px' })
    const nodes = [
      el(0, -1, 'DIV', 1, { rect: { x: 0, y: 0, w: 200, h: 100 } }),
      text(1, 0, 'two lines here', {
        rect: { x: 0, y: 0, w: 200, h: 100 },
        glyphRects: [
          { x: 8, y: 10, w: 120, h: 20 },
          { x: 8, y: 34, w: 90, h: 20 },
        ],
      }),
    ]
    const { slides } = run(nodes, [BASE_STYLE, padded])
    const out = texts(slides[0].nodes)[0]
    // Glyph bounds for wrapped text are the width of the LONGEST LINE, so
    // handing PowerPoint 120px guarantees a second, tighter wrap: "a short caption" came back over three lines and overflowed its box. The browser
    // wrapped against the content box, which is 200 less 8px either side.
    expect(out.rect).toEqual({ x: 8, y: 10, w: 184, h: 44 })
    // Vertical position still comes from the glyphs, not the element.
    expect(out.rect.y).toBe(10)
    expect(out.lineCount).toBe(2)
  })
})

describe('trap 11: list bullets are pseudo-elements', () => {
  it('recovers a ::marker glyph that has no text node', () => {
    const item = style({ display: 'list-item' })
    const nodes = [
      el(0, -1, 'LI', 1, { marker: '• ' }),
      text(1, 0, 'first point'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, item])
    const out = texts(slides[0].nodes)
    // A plain DOM walk drops every bullet in the deck, because ::marker is not
    // in the tree.
    expect(out.some(t => t.runs[0].text.includes('•'))).toBe(true)
    expect(out.some(t => t.runs[0].text === 'first point')).toBe(true)
  })
})

describe('traps 4, 5, 12, 13: what has to become a picture', () => {
  it('rasterizes a mermaid svg whose labels are foreignObject', () => {
    expect(rasterReasonFor(el(0, -1, 'SVG', 0, { hasForeignObject: true }), BASE_STYLE))
      .toBe('foreign-object')
  })

  it('rasterizes svg, canvas and cross-origin iframes', () => {
    expect(rasterReasonFor(el(0, -1, 'SVG', 0), BASE_STYLE)).toBe('svg')
    expect(rasterReasonFor(el(0, -1, 'CANVAS', 0), BASE_STYLE)).toBe('canvas')
    // demo/starter embeds <Tweet>, which is a cross-origin frame the walker
    // cannot descend into at all.
    expect(rasterReasonFor(el(0, -1, 'IFRAME', 0), BASE_STYLE)).toBe('iframe')
  })

  it('rasterizes a css background image and a gradient-filled heading', () => {
    expect(rasterReasonFor(el(0, -1, 'DIV', 0), style({ backgroundImage: 'url(cover.jpg)' })))
      .toBe('background-image')
    expect(rasterReasonFor(el(0, -1, 'H1', 0), style({ webkitBackgroundClip: 'text' })))
      .toBe('background-clip-text')
  })

  it('keeps a shadow-root diagram rather than skipping it', () => {
    const nodes = [
      el(0, -1, 'DIV', 0),
      el(1, 0, 'SVG', 0, { fromShadowRoot: true, hasForeignObject: true }),
    ]
    const { slides, rasterRequests } = run(nodes, [BASE_STYLE])
    // Mermaid renders into a shadow root, so a document-level query finds
    // nothing and the diagram vanishes from the export entirely.
    expect(slides[0].nodes.some(n => n.kind === 'raster')).toBe(true)
    expect(rasterRequests).toHaveLength(1)
  })
})

describe('a picture with content over it is captured in isolation', () => {
  it('isolates a leaf picture that a title is drawn on top of', () => {
    const full = { x: 0, y: 0, w: 980, h: 552 }
    const title = { x: 80, y: 200, w: 400, h: 60 }
    const nodes = [
      el(0, -1, 'SVG', 0, { rect: full }),
      el(1, -1, 'H1', 0, { rect: title }),
      text(2, 1, 'A cover title', { rect: title, glyphRects: [title] }),
    ]
    const { slides, rasterRequests } = run(nodes, [BASE_STYLE])
    // `locator.screenshot()` clips the page rather than isolating the element,
    // so without this the title is baked into the picture AND drawn again as
    // a shape, printing every line of the slide twice.
    const raster = slides[0].nodes.find(n => n.kind === 'raster') as any
    expect(raster.isolate).toBe(true)
    expect(rasterRequests[0].isolate).toBe(true)
    // But NOT its own children: an <svg>'s children are its artwork, and
    // nothing redraws them, so hiding those emptied the decorative chrome out
    // of a themed deck entirely.
    expect(rasterRequests[0].hideDescendants).toBe(false)
  })

  it('leaves a picture alone when nothing is drawn over it', () => {
    const corner = { x: 0, y: 0, w: 100, h: 100 }
    const away = { x: 500, y: 400, w: 200, h: 20 }
    const nodes = [
      el(0, -1, 'SVG', 0, { rect: corner }),
      el(1, -1, 'DIV', 0, { rect: away }),
      text(2, 1, 'caption', { rect: away, glyphRects: [away] }),
    ]
    const { rasterRequests } = run(nodes, [BASE_STYLE])
    // Isolation costs two DOM mutations per capture, so it is not free.
    expect(rasterRequests[0].isolate).toBe(false)
  })
})

describe('trap 10: only backdrops need isolation', () => {
  it('isolates a backdrop but not a leaf picture', () => {
    const backdrop = run(
      [el(0, -1, 'DIV', 1), el(1, 0, 'DIV', 0), text(2, 1, 'on top')],
      [BASE_STYLE, style({ backgroundImage: 'linear-gradient(red, blue)' })],
    )
    const raster = backdrop.slides[0].nodes.find(n => n.kind === 'raster') as any
    // Without hiding siblings, the text bakes into the backdrop picture and is
    // then drawn again as a shape, doubling every word.
    expect(raster.isolate).toBe(true)
    // A backdrop's children ARE walked and redrawn, so hiding them is correct.
    expect(raster.hideDescendants).toBe(true)
    // Its children are still walked, so the text survives as editable text.
    expect(texts(backdrop.slides[0].nodes)).toHaveLength(1)

    const leaf = run([el(0, -1, 'SVG', 0)], [BASE_STYLE])
    expect((leaf.slides[0].nodes[0] as any).isolate).toBe(false)
  })
})

describe('tier 4: the safety valve', () => {
  it('falls back when a slide with text yields none', () => {
    // Every text node sits under an <svg>, so all of it rasterizes.
    const nodes = [el(0, -1, 'SVG', 0), text(1, 0, 'invisible to the walk')]
    const { slides } = run(nodes, [BASE_STYLE])
    expect(slides[0].fallbackReason).toMatch(/no text could be recovered/)
  })

  it('falls back when most of the slide is a picture with nothing over it', () => {
    const big = { x: 0, y: 0, w: 900, h: 500 }
    const away = { x: 905, y: 505, w: 60, h: 20 }
    const nodes = [
      el(0, -1, 'SVG', 0, { rect: big }),
      el(1, -1, 'DIV', 0, { rect: away }),
      text(2, 1, 'a caption in the corner', { rect: away, glyphRects: [away] }),
    ]
    const { slides } = run(nodes, [BASE_STYLE])
    // The caption sits beside the picture rather than on it, so vectorizing
    // really did recover almost nothing.
    expect(slides[0].fallbackReason).toMatch(/rasterized/)
  })

  it('keeps a slide whose text sits ON TOP of a full-bleed picture', () => {
    const full = { x: 0, y: 0, w: 980, h: 552 }
    const title = { x: 80, y: 200, w: 400, h: 60 }
    const nodes = [
      el(0, -1, 'SVG', 0, { rect: full }),
      el(1, -1, 'H1', 0, { rect: title }),
      text(2, 1, 'A cover title', { rect: title, glyphRects: [title] }),
    ]
    const { slides } = run(nodes, [BASE_STYLE])
    // A cover photo or decorative graphic covers the slide by definition. The
    // title over it vectorizes perfectly, so counting the picture against the
    // budget threw away the text on every cover slide in the deck.
    expect(slides[0].fallbackReason).toBeUndefined()
    expect(texts(slides[0].nodes)[0].runs[0].text).toBe('A cover title')
  })

  it('does not request captures for a slide that is falling back anyway', () => {
    const nodes = [el(0, -1, 'SVG', 0), text(1, 0, 'invisible to the walk')]
    const { rasterRequests } = run(nodes, [BASE_STYLE])
    // The whole slide becomes one picture, so per-element captures would be
    // paid for and thrown away.
    expect(rasterRequests).toHaveLength(0)
  })

  it('leaves an ordinary slide alone', () => {
    const nodes = [el(0, -1, 'DIV', 0), text(1, 0, 'ordinary content')]
    const { slides } = run(nodes, [BASE_STYLE])
    expect(slides[0].fallbackReason).toBeUndefined()
  })
})

describe('trap 16: content outside the slide', () => {
  it('clips a shape that overflows the slide', () => {
    const wide = style({ backgroundColor: 'rgb(1, 2, 3)' })
    const nodes = [el(0, -1, 'DIV', 1, { rect: { x: 900, y: 0, w: 500, h: 100 } })]
    const { slides } = run(nodes, [BASE_STYLE, wide])
    // A slide container is overflow:hidden, but PowerPoint has no clipping, so
    // an unclamped shape sits off the canvas where it cannot even be selected.
    expect(boxes(slides[0].nodes)[0].rect).toEqual({ x: 900, y: 0, w: 80, h: 100 })
  })

  it('drops a shape that is entirely off the slide', () => {
    const off = style({ backgroundColor: 'rgb(1, 2, 3)' })
    const nodes = [el(0, -1, 'DIV', 1, { rect: { x: 2000, y: 0, w: 100, h: 100 } })]
    const { slides } = run(nodes, [BASE_STYLE, off])
    expect(boxes(slides[0].nodes)).toHaveLength(0)
  })

  it('captures a runaway element as a clipped region, not as itself', () => {
    // Slidev's own starter deck carries an element measuring tens of millions
    // of pixels. Screenshotting it whole asks Chromium for a bitmap it cannot
    // allocate, and the renderer dies mid-export; the failure then surfaces
    // from an unrelated call as "Target page, context or browser has been
    // closed", which is a miserable thing to debug.
    // Only the left edge of it is on the slide, so this does not also trip the
    // whole-slide fallback, which withholds captures by design.
    const huge = { x: 900, y: 0, w: 24_000_000, h: 300 }
    const page = { x: 1000, y: 200, w: 24_000_000, h: 300 }
    const nodes = [el(0, -1, 'CANVAS', 0, { rect: huge, pageRect: page })]
    const { slides, rasterRequests } = run(nodes, [BASE_STYLE])
    const raster = slides[0].nodes[0] as any
    // Placed at the clipped rectangle, and captured at the same one, so the
    // picture is neither squashed nor enormous.
    expect(raster.rect).toEqual({ x: 900, y: 0, w: 80, h: 300 })
    expect(rasterRequests[0].clip).toEqual({ x: 1000, y: 200, w: 80, h: 300 })
  })

  it('does not let a runaway rect blow up the fallback maths', () => {
    // Slidev's own starter deck has an element measuring tens of millions of
    // pixels, which reported "104064986954% of the slide had to be rasterized".
    // No text here, so the area rule is the one under test.
    const huge = { x: 0, y: 0, w: 24_000_000, h: 24_000_000 }
    const { slides } = run([el(0, -1, 'CANVAS', 0, { rect: huge })], [BASE_STYLE])
    expect(slides[0].fallbackReason).toMatch(/^100% of the slide/)
  })
})

describe('a full-bleed backdrop does not trigger the fallback', () => {
  it('keeps the text on a cover slide editable', () => {
    const cover = style({ backgroundImage: 'url(https://cover.sli.dev)' })
    const nodes = [
      el(0, -1, 'DIV', 1, { rect: { x: 0, y: 0, w: 980, h: 552 } }),
      el(1, 0, 'H1', 0),
      text(2, 1, 'Welcome to Slidev'),
    ]
    const { slides } = run(nodes, [BASE_STYLE, cover])
    // A cover photo covers 100% of the slide by definition, but the title on
    // top of it is still perfectly vectorizable. Counting isolated backdrops
    // toward the raster budget sent every deck with a cover straight to the
    // whole-slide fallback.
    expect(slides[0].fallbackReason).toBeUndefined()
    expect(texts(slides[0].nodes)[0].runs[0].text).toBe('Welcome to Slidev')
  })
})

describe('fonts', () => {
  it('names the family the browser actually resolved', () => {
    const nodes = [el(0, -1, 'DIV', 0), text(1, 0, 'hello')]
    const { slides } = run(nodes, [BASE_STYLE])
    expect(texts(slides[0].nodes)[0].runs[0].fontFamily).toBe('Inter')
  })

  it('strips the @fontsource Variable suffix when nothing resolved', () => {
    const nodes = [el(0, -1, 'DIV', 1), text(1, 0, 'hello')]
    const styles = [BASE_STYLE, style({ fontFamily: '"Inter Variable", sans-serif' })]
    const { slides } = run(nodes, styles)
    // Nobody has a font installed under the name "Inter Variable"; that is a
    // packaging artifact of @fontsource-variable.
    expect(texts(slides[0].nodes)[0].runs[0].fontFamily).toBe('Inter')
  })
})

describe('boxes', () => {
  it('ignores a fully transparent background', () => {
    const nodes = [el(0, -1, 'DIV', 0)]
    const { slides } = run(nodes, [BASE_STYLE])
    expect(boxes(slides[0].nodes)).toHaveLength(0)
  })

  it('keeps one side of a border', () => {
    const accent = style({ borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'rgb(0, 128, 0)' })
    const nodes = [el(0, -1, 'DIV', 1)]
    const { slides } = run(nodes, [BASE_STYLE, accent])
    const box = boxes(slides[0].nodes)[0]
    expect(box.borders?.[3]).toEqual({ width: 4, color: { r: 0, g: 128, b: 0, a: 1 }, style: 'solid' })
    expect(box.borders?.[0]).toBeUndefined()
  })
})

describe('lines are grouped by overlap, not by matching tops', () => {
  it('counts one line when a heading mixes run sizes', () => {
    // A browser aligns runs of different sizes on a shared BASELINE, so their
    // rect tops differ while they sit on the same line. Grouping by top
    // counted `Needed a **Pros-Cons comparison** in now?` as four lines where
    // it has two, and the spacing that came out of that count set the two real
    // lines on top of each other.
    const small = { x: 0, y: 130, w: 120, h: 40 }
    const large = { x: 120, y: 100, w: 400, h: 100 }
    const nodes = [
      el(0, -1, 'H1', 0, { rect: { x: 0, y: 100, w: 520, h: 220 } }),
      text(1, 0, 'Needed a ', { glyphRects: [small] }),
      text(2, 0, 'Pros-Cons', { glyphRects: [large] }),
      text(3, 0, 'comparison', { glyphRects: [{ ...large, y: 220 }] }),
      text(4, 0, ' in now?', { glyphRects: [{ ...small, y: 250 }] }),
    ]
    const [line] = texts(run(nodes, [BASE_STYLE]).slides[0].nodes)
    expect(line.lineCount).toBe(2)
  })

  it('takes the line spacing from the measured line boxes', () => {
    // The computed `line-height` belongs to the element while a line box is as
    // tall as its largest run, so a heading mixing sizes reported far too
    // little leading and PowerPoint overlapped the lines.
    const nodes = [
      el(0, -1, 'H1', 0, { rect: { x: 0, y: 0, w: 400, h: 240 } }),
      text(1, 0, 'first', { glyphRects: [{ x: 0, y: 0, w: 300, h: 100 }] }),
      text(2, 0, 'second', { glyphRects: [{ x: 0, y: 120, w: 300, h: 100 }] }),
    ]
    const [line] = texts(run(nodes, [BASE_STYLE]).slides[0].nodes)
    // 120, the distance between the line tops. `line-height: normal` on a
    // 16px font would have said 19.2.
    expect(line.lineHeight).toBe(120)
  })

  it('still separates lines whose ink very nearly touches', () => {
    const nodes = [
      el(0, -1, 'P', 0, { rect: { x: 0, y: 0, w: 400, h: 40 } }),
      text(1, 0, 'one', { glyphRects: [{ x: 0, y: 0, w: 300, h: 20 }] }),
      text(2, 0, 'two', { glyphRects: [{ x: 0, y: 19, w: 300, h: 20 }] }),
    ]
    const [line] = texts(run(nodes, [BASE_STYLE]).slides[0].nodes)
    expect(line.lineCount).toBe(2)
  })
})

describe('a wrapped inline box is painted once per line', () => {
  it('emits one shape per line fragment', () => {
    // CSS paints an inline element's background once per line FRAGMENT, while
    // `getBoundingClientRect` reports the union of them. Drawn as that union,
    // an inline `<code>` running across three lines filled the ragged space at
    // the end of every line with its own dark background.
    const inline = style({ display: 'inline', backgroundColor: 'rgb(0, 0, 0)' })
    const fragments = [
      { x: 100, y: 0, w: 200, h: 20 },
      { x: 0, y: 20, w: 300, h: 20 },
      { x: 0, y: 40, w: 80, h: 20 },
    ]
    const nodes = [
      el(0, -1, 'CODE', 1, { rect: { x: 0, y: 0, w: 300, h: 60 }, fragments }),
    ]
    const painted = boxes(run(nodes, [BASE_STYLE, inline]).slides[0].nodes)
    expect(painted.map(box => box.rect)).toEqual(fragments)
  })

  it('leaves an unwrapped element as one shape', () => {
    const filled = style({ backgroundColor: 'rgb(0, 0, 0)' })
    const nodes = [el(0, -1, 'DIV', 1, { rect: { x: 0, y: 0, w: 300, h: 60 } })]
    const painted = boxes(run(nodes, [BASE_STYLE, filled]).slides[0].nodes)
    expect(painted).toHaveLength(1)
    expect(painted[0].rect).toEqual({ x: 0, y: 0, w: 300, h: 60 })
  })
})

describe('a raster that cannot be placed must not swallow its subtree', () => {
  it('walks into a rotated wrapper that has no box of its own', () => {
    // A theme rotating a corner decoration puts the transform on a wrapper
    // with no size, while the artwork inside is absolutely positioned and does
    // have one. Treating the wrapper as rasterized dropped the whole
    // decoration: the picture had no area, so nothing was emitted for it
    // either, and the entire corner vanished from every slide.
    const rotated = style({ transform: 'matrix(0, 1, -1, 0, 0, 0)', position: 'absolute' })
    const nodes = [
      el(0, -1, 'DIV', 1, { rect: { x: 0, y: 0, w: 0, h: 0 } }),
      el(1, 0, 'SVG', 0, { rect: { x: 10, y: 20, w: 279, h: 322 } }),
    ]
    const { slides, rasterRequests } = run(nodes, [BASE_STYLE, rotated])
    expect(slides[0].nodes.map(node => node.sourceId)).toEqual([1])
    expect(rasterRequests.map(request => request.sourceId)).toEqual([1])
  })
})
