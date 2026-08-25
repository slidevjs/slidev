import type { RawNode, RawSlide, RawSnapshot, RawStyle } from './ir'

/**
 * The one function that runs inside the browser. Invariant: zero free variables.
 * Playwright serializes this function's source and evaluates it where none of this
 * module's imports exist, so everything it needs is nested inside it or passed as a
 * parameter; `walker.test.ts` enforces this mechanically. The type-only import above
 * is erased at compile time and is safe.
 *
 * It extracts facts only a live layout engine can supply and makes no decisions;
 * every judgement lives in `normalize.ts`, where it can be unit-tested.
 */
export function collectSnapshot(options: {
  containerSelector: string
  idAttribute: string
}): RawSnapshot {
  const STYLE_KEYS = [
    'display',
    'position',
    'zIndex',
    'visibility',
    'opacity',
    'color',
    'backgroundColor',
    'backgroundImage',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'textAlign',
    'textDecorationLine',
    'textTransform',
    'letterSpacing',
    'lineHeight',
    'whiteSpace',
    'paddingLeft',
    'paddingRight',
    'borderTopWidth',
    'borderTopStyle',
    'borderTopColor',
    'borderRightWidth',
    'borderRightStyle',
    'borderRightColor',
    'borderBottomWidth',
    'borderBottomStyle',
    'borderBottomColor',
    'borderLeftWidth',
    'borderLeftStyle',
    'borderLeftColor',
    'borderTopLeftRadius',
    'boxShadow',
    'filter',
    'backdropFilter',
    'mixBlendMode',
    'clipPath',
    'transform',
    'writingMode',
    'webkitBackgroundClip',
    'top',
    'right',
    'bottom',
    'left',
    'width',
    'height',
    'overflow',
  ] as const

  /** Strips the quotes CSS keeps around a `content` or font family value. */
  const RE_QUOTES = /^["']|["']$/g

  const styles: RawStyle[] = []
  const styleIndex = new Map<string, number>()

  /**
   * Intern a computed style: `getComputedStyle` exposes several hundred properties,
   * so serializing a full style per node turns a snapshot into megabytes crossing
   * the CDP boundary. A few hundred nodes collapse to a few dozen distinct styles.
   */
  function intern(computed: CSSStyleDeclaration): number {
    const record: Record<string, string> = {}
    for (const key of STYLE_KEYS)
      record[key] = computed[key as any] ?? ''
    const key = JSON.stringify(record)
    const existing = styleIndex.get(key)
    if (existing !== undefined)
      return existing
    const index = styles.length
    // Complete by construction: every `RawStyle` key comes from `STYLE_KEYS`.
    styles.push(record as unknown as RawStyle)
    styleIndex.set(key, index)
    return index
  }

  /**
   * Which family a CSS font stack actually resolves to on this machine, measured by
   * rendering a probe string and comparing widths: `document.fonts.check()` returns
   * true for families that do not exist.
   */
  const unplaceablePseudos: string[] = []
  const fontResolution: Record<string, string> = {}
  const probeCanvas = document.createElement('canvas')
  const probeContext = probeCanvas.getContext('2d')!
  const PROBE = 'mmmmmmmmmmlliWWWWWW0Oo'
  const BASES = ['monospace', 'sans-serif', 'serif']
  const baseWidths: Record<string, number> = {}
  for (const base of BASES) {
    probeContext.font = `72px ${base}`
    baseWidths[base] = probeContext.measureText(PROBE).width
  }

  function isAvailable(family: string): boolean {
    for (const base of BASES) {
      probeContext.font = `72px "${family}", ${base}`
      // A missing family falls through to the base, so an identical width
      // against every base means it never took effect.
      if (probeContext.measureText(PROBE).width !== baseWidths[base])
        return true
    }
    return false
  }

  // CSS keywords, not typefaces; naming one in a .pptx makes PowerPoint substitute its default.
  const GENERIC = [
    'system-ui',
    'ui-sans-serif',
    'ui-serif',
    'ui-monospace',
    'ui-rounded',
    'sans-serif',
    'serif',
    'monospace',
    'cursive',
    'fantasy',
    'math',
    'emoji',
    'fangsong',
    'inherit',
    'initial',
    'unset',
  ]

  function resolveStack(stack: string): void {
    if (stack in fontResolution)
      return
    for (const raw of stack.split(',')) {
      const family = raw.trim().replace(RE_QUOTES, '')
      if (!family)
        continue
      if (GENERIC.includes(family.toLowerCase()) || family.charAt(0) === '-')
        continue
      // `@fontsource-variable` names its family "Inter Variable"; the face
      // people actually have installed is "Inter".
      const cleaned = family.replace(/\s+Variable$/, '')
      if (isAvailable(cleaned)) {
        fontResolution[stack] = cleaned
        return
      }
    }
    fontResolution[stack] = ''
  }

  /**
   * The nearest painted background color at or above the slide container; themes
   * can put `bg-main` on an ancestor rather than on the container itself.
   */
  function backgroundOf(container: Element): string | undefined {
    // Any fully transparent color ends nothing: matching only the literal
    // `rgba(0, 0, 0, 0)` misses `rgba(255, 255, 255, 0)` and `oklch(... / 0)`.
    // The browser judges, since it accepts syntaxes no parser here does.
    const probe = document.createElement('canvas').getContext('2d')
    let node: Element | null = container
    while (node) {
      const color = getComputedStyle(node).backgroundColor
      if (color && color !== 'transparent') {
        if (!probe)
          return color
        // Painting over an opaque backdrop leaves it untouched only when the color contributes nothing.
        probe.clearRect(0, 0, 1, 1)
        probe.fillStyle = color
        probe.fillRect(0, 0, 1, 1)
        if (probe.getImageData(0, 0, 1, 1).data[3] !== 0)
          return color
      }
      node = node.parentElement
    }
    return undefined
  }

  /**
   * The text an ordinary list marker renders, which the DOM never exposes; ordered
   * lists need the ordinal counted over previous list-item siblings.
   */
  function markerGlyph(el: Element, listStyleType: string): string {
    const BULLETS: Record<string, string> = {
      'disc': '\u2022 ',
      'circle': '\u25E6 ',
      'square': '\u25AA ',
      'disclosure-open': '\u25BE ',
      'disclosure-closed': '\u25B8 ',
    }
    if (listStyleType in BULLETS)
      return BULLETS[listStyleType]

    let ordinal = 1
    let sibling = el.previousElementSibling
    while (sibling) {
      if (getComputedStyle(sibling).display === 'list-item')
        ordinal++
      sibling = sibling.previousElementSibling
    }
    const parent = el.parentElement
    const start = parent && parent.tagName.toUpperCase() === 'OL'
      ? Number(parent.getAttribute('start') || '1')
      : 1
    const value = ordinal + (Number.isFinite(start) ? start : 1) - 1

    if (listStyleType === 'lower-alpha' || listStyleType === 'lower-latin')
      return `${String.fromCharCode(96 + ((value - 1) % 26) + 1)}. `
    if (listStyleType === 'upper-alpha' || listStyleType === 'upper-latin')
      return `${String.fromCharCode(64 + ((value - 1) % 26) + 1)}. `
    return `${value}. `
  }

  const containers = Array.from(document.querySelectorAll(options.containerSelector))
  const slides: RawSlide[] = []
  let nextId = 0

  for (const container of containers) {
    const containerRect = container.getBoundingClientRect()

    // A print page stacks every slide into one tall viewport; a container not
    // being rendered has a zero-sized rect. `--range` is the caller's filter.
    if (containerRect.width === 0 || containerRect.height === 0)
      continue

    // `003-02` is slide 3, click step 2 (1-based in the id).
    const parts = (container.id || '').split('-')
    const no = Number(parts[0])
    const clickIndex = Number(parts[1]) - 1
    if (!Number.isFinite(no))
      continue

    const nodes: RawNode[] = []

    function relative(rect: DOMRect | { left: number, top: number, width: number, height: number }) {
      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        w: rect.width,
        h: rect.height,
      }
    }

    function walk(node: Node, parent: number, fromShadowRoot: boolean, inheritedOpacity: number): void {
      if (node.nodeType === 3) {
        const text = node.textContent ?? ''
        // A whitespace-only node can hold the only space between two inline
        // elements; kept when it occupies a line box, ignored when collapsed.
        if (!text)
          return
        const range = document.createRange()
        range.selectNodeContents(node)
        const rects = Array.from(range.getClientRects())
        range.detach()
        // A rect-less node still matters when it holds a newline: inside
        // `white-space: pre` it is the only record of where a line ends.
        if (!rects.length) {
          if (!text.includes('\n'))
            return
          nodes.push({ id: nextId++, parent, tag: '#text', style: -1, rect: { x: 0, y: 0, w: 0, h: 0 }, glyphRects: [], text })
          return
        }
        // Glyph rects, not the element box: positioned from the element rect the text lands offset and re-wraps.
        const bounds = {
          left: Math.min(...rects.map(r => r.left)),
          top: Math.min(...rects.map(r => r.top)),
          width: Math.max(...rects.map(r => r.right)) - Math.min(...rects.map(r => r.left)),
          height: Math.max(...rects.map(r => r.bottom)) - Math.min(...rects.map(r => r.top)),
        }
        nodes.push({
          id: nextId++,
          parent,
          tag: '#text',
          style: -1,
          rect: relative(bounds),
          glyphRects: rects.map(relative),
          text,
          // A text node inherits the compounded opacity; without it a greyed paragraph exports solid.
          ...(inheritedOpacity < 1 ? { opacity: inheritedOpacity } : {}),
        })
        return
      }

      if (node.nodeType !== 1)
        return

      const el = node as Element
      const id = nextId++
      const computed = getComputedStyle(el)

      // `visibility: hidden` and `opacity: 0` still have boxes: a not-yet-revealed
      // v-click element sits at opacity 0 and would export onto every click step.
      if (computed.display === 'none' || computed.visibility === 'hidden')
        return
      const own = Number(computed.opacity)
      // CSS `opacity` does not inherit, and DrawingML has no group opacity to stand
      // in for a wrapper's, so it is compounded here while the tree is available.
      const effectiveOpacity = inheritedOpacity * (Number.isFinite(own) ? own : 1)
      if (effectiveOpacity === 0)
        return

      el.setAttribute(options.idAttribute, String(id))
      resolveStack(computed.fontFamily)

      const box = el.getBoundingClientRect()
      const record: RawNode = {
        id,
        parent,
        tag: el.tagName.toUpperCase(),
        style: intern(computed),
        rect: relative(box),
        // Document coordinates too: an element overflowing the slide is
        // captured as a page clip, which needs a page-space rectangle.
        pageRect: {
          x: box.left + window.scrollX,
          y: box.top + window.scrollY,
          w: box.width,
          h: box.height,
        },
      }
      if (effectiveOpacity < 1)
        record.opacity = effectiveOpacity
      // An inline box that wraps paints once per line, so backgrounds belong to
      // the fragments. Only `inline` proper: an inline-block has one rect.
      if (computed.display === 'inline') {
        const fragments = Array.from(el.getClientRects())
        if (fragments.length > 1)
          record.fragments = fragments.map(relative)
      }
      if (fromShadowRoot)
        record.fromShadowRoot = true
      // KaTeX marks its root by class; the MathML it writes for screen readers is display:none.
      if (el.classList.contains('katex'))
        record.isMath = true
      if (el.tagName.toUpperCase() === 'IMG') {
        record.src = (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src
        const alt = (el as HTMLImageElement).alt
        if (alt)
          record.alt = alt
      }
      if (el.tagName.toUpperCase() === 'A') {
        const href = (el as HTMLAnchorElement).href
        if (href)
          record.href = href
      }
      if (el.tagName.toUpperCase() === 'SVG' && el.querySelector('foreignObject'))
        // Mermaid puts its labels in <foreignObject> HTML with no <text>
        // element; the normalizer routes these to a picture.
        record.hasForeignObject = true

      // `::marker` is a pseudo-element, so a bullet has no text node. Reading
      // `content` alone recovers only custom markers: Chromium reports it as
      // `normal` for ordinary lists and leaves the glyph to `list-style-type`.
      if (computed.display === 'list-item') {
        const marker = getComputedStyle(el, '::marker')
        const explicit = marker && marker.content
          && marker.content !== 'none'
          && marker.content !== 'normal'
        if (explicit) {
          record.marker = marker.content.replace(RE_QUOTES, '')
        }
        else if (computed.listStyleType !== 'none') {
          record.marker = markerGlyph(el, computed.listStyleType)
        }
      }

      nodes.push(record)

      // `::before` and `::after` have no DOM node, so a tree walk cannot see
      // them, and themes use them for decorative marks. Only absolutely
      // positioned pseudos are placeable: anything in flow has geometry not
      // recoverable from computed style alone, and is reported instead.
      for (const which of ['::before', '::after']) {
        const pseudo = getComputedStyle(el, which)
        if (!pseudo || !pseudo.content || pseudo.content === 'none')
          continue
        const paints = pseudo.content !== 'normal'
          || (pseudo.backgroundImage && pseudo.backgroundImage !== 'none')
        if (!paints)
          continue
        if (pseudo.position !== 'absolute' || computed.position === 'static') {
          unplaceablePseudos.push(`${el.tagName.toLowerCase()}${which}`)
          continue
        }

        const own = el.getBoundingClientRect()
        const width = Number.parseFloat(pseudo.width) || 0
        const height = Number.parseFloat(pseudo.height) || 0
        if (width <= 0 || height <= 0) {
          unplaceablePseudos.push(`${el.tagName.toLowerCase()}${which}`)
          continue
        }
        // `auto` parses to NaN, which spreads through the whole `pageRect` and
        // loses the decoration to a failed clip. Zero is what `auto` resolves
        // to for an absolutely positioned box with no other constraint.
        const px = (value: string): number => Number.parseFloat(value) || 0
        const left = pseudo.left === 'auto'
          ? own.width - px(pseudo.right) - width
          : px(pseudo.left)
        const top = pseudo.top === 'auto'
          ? own.height - px(pseudo.bottom) - height
          : px(pseudo.top)

        const box = {
          left: own.left + left,
          top: own.top + top,
          width,
          height,
        }
        // Document coordinates, not viewport ones: the clip screenshot is taken
        // after other captures have scrolled the page, so viewport coordinates
        // read at measurement time are stale by then.
        const pageRect = {
          x: box.left + window.scrollX,
          y: box.top + window.scrollY,
          w: width,
          h: height,
        }
        const text = pseudo.content.replace(RE_QUOTES, '')
        nodes.push({
          id: nextId++,
          parent: id,
          tag: which === '::before' ? '::BEFORE' : '::AFTER',
          style: intern(pseudo),
          rect: relative(box),
          // A pseudo has no element to screenshot, so it is captured by clipping the page.
          pageRect,
          ...(text && pseudo.content !== 'normal' ? { text } : {}),
        })
      }

      // Descend into the shadow root as well; Mermaid renders into one.
      const shadow = (el as any).shadowRoot
      if (shadow) {
        for (const child of Array.from(shadow.childNodes) as Node[])
          walk(child, id, true, effectiveOpacity)
      }

      // Recurse through zero-sized boxes rather than pruning them: a cover
      // slide commonly hangs its title off a wrapper that measures 0 high.
      for (const child of Array.from(el.childNodes) as Node[])
        walk(child, id, fromShadowRoot, effectiveOpacity)
    }

    for (const child of Array.from(container.childNodes) as Node[])
      walk(child, -1, false, 1)

    slides.push({
      no,
      clickIndex: Number.isFinite(clickIndex) ? clickIndex : 0,
      // The exact id: with `--with-clicks` a prefix match plus `.first()`
      // hands every step a picture of step one.
      containerId: container.id,
      size: { w: containerRect.width, h: containerRect.height },
      // The container's own background is never reached by a walk that starts
      // at its children; without it a dark theme exports onto default white.
      background: backgroundOf(container),
      nodes,
    })
  }

  return { slides, styles, fontResolution, unplaceablePseudos } as RawSnapshot
}
