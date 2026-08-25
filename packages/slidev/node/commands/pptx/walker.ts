import type { RawSnapshot } from './ir'

/**
 * The one function that runs inside the browser.
 *
 * INVARIANT: zero free variables. Everything it needs is nested inside it or
 * passed as a parameter, because Playwright serialises this function's source
 * and evaluates it in a context where none of this module's imports exist.
 * `walker.test.ts` enforces this mechanically; do not rely on remembering it.
 *
 * The type-only import above is erased at compile time and is therefore safe.
 *
 * It is also deliberately DUMB. It extracts facts that only a live layout
 * engine can supply, and makes no decisions at all. Every judgement - what is
 * a paragraph, what has to be rasterized, what colour that really is - lives
 * in `normalize.ts` on the Node side, where it can be unit-tested against a
 * hand-written fixture. An earlier version of this design put ~340 lines of
 * decision-making in here and none of it could be tested.
 */
export function collectSnapshot(options: {
  containerSelector: string
  idAttribute: string
}): RawSnapshot {
  const STYLE_KEYS = [
    'display',
    'position',
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

  const styles: any[] = []
  const styleIndex = new Map<string, number>()

  /**
   * Intern a computed style.
   *
   * `getComputedStyle` exposes several hundred properties and a slide has a few
   * hundred nodes, so serialising a full style per node is what turns a
   * snapshot into megabytes crossing the CDP boundary. In practice a few
   * hundred nodes collapse to a few dozen distinct styles.
   */
  function internPseudo(computed: CSSStyleDeclaration): number {
    const record: Record<string, string> = {}
    for (const key of STYLE_KEYS)
      record[key] = computed[key as any] ?? ''
    const key = JSON.stringify(record)
    const existing = styleIndex.get(key)
    if (existing !== undefined)
      return existing
    const index = styles.length
    styles.push(record)
    styleIndex.set(key, index)
    return index
  }

  function internStyle(el: Element): number {
    const computed = getComputedStyle(el)
    const record: Record<string, string> = {}
    for (const key of STYLE_KEYS)
      record[key] = computed[key as any] ?? ''
    const key = JSON.stringify(record)
    const existing = styleIndex.get(key)
    if (existing !== undefined)
      return existing
    const index = styles.length
    styles.push(record)
    styleIndex.set(key, index)
    return index
  }

  /**
   * Which family a CSS font stack actually resolves to on this machine.
   *
   * Measured by rendering a probe string and comparing widths, because
   * `document.fonts.check()` returns TRUE for families that do not exist. A
   * deck whose CSS leads with a licensed corporate face would otherwise name
   * that face in the file, and every recipient would silently get a
   * substitution while the export claimed success.
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
      // A family that does not exist falls through to the base, so an
      // identical width against EVERY base means it never took effect.
      if (probeContext.measureText(PROBE).width !== baseWidths[base])
        return true
    }
    return false
  }

  // CSS keywords, not typefaces. Naming one of these in a .pptx asks
  // PowerPoint for a font called "system-ui", which does not exist anywhere,
  // so it substitutes its own default and the deck sets in something arbitrary.
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
      const family = raw.trim().replace(/^["']|["']$/g, '')
      if (!family)
        continue
      if (GENERIC.includes(family.toLowerCase()) || family.charAt(0) === '-')
        continue
      // `@fontsource-variable` names its family "Inter Variable", which nobody
      // has installed under that name. The face people actually have is "Inter".
      const cleaned = family.replace(/\s+Variable$/, '')
      if (isAvailable(cleaned)) {
        fontResolution[stack] = cleaned
        return
      }
    }
    fontResolution[stack] = ''
  }

  /**
   * The nearest painted background colour at or above the slide container.
   *
   * Slidev puts `bg-main` on an ancestor rather than on the container itself
   * depending on the theme, so the first non-transparent colour up the chain is
   * what the audience actually sees behind the slide.
   */
  function backgroundOf(container: Element): string | undefined {
    let node: Element | null = container
    while (node) {
      const color = getComputedStyle(node).backgroundColor
      if (color && color !== 'transparent' && !/^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$/.test(color))
        return color
      node = node.parentElement
    }
    return undefined
  }

  /**
   * The text an ordinary list marker renders, which the DOM never exposes.
   *
   * Ordered lists need the item's ordinal, counted over previous list-item
   * siblings and offset by the list's `start`, because the marker is a
   * generated glyph rather than content.
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
  const slides: any[] = []
  let nextId = 0

  for (const container of containers) {
    const containerRect = container.getBoundingClientRect()

    // A print page stacks every slide into one tall viewport, so a container
    // that is not being rendered has a zero-sized rect.
    //
    // Note that this does NOT implement `--range`: the print route renders
    // every slide whatever the `range` query says, so the caller filters by
    // slide number, exactly as the image exporter does.
    if (containerRect.width === 0 || containerRect.height === 0)
      continue

    // `003-02` is slide 3, click step 2 (1-based in the id).
    const parts = (container.id || '').split('-')
    const no = Number(parts[0])
    const clickIndex = Number(parts[1]) - 1
    if (!Number.isFinite(no))
      continue

    const nodes: any[] = []

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
        // A whitespace-only node is NOT noise. Markup such as
        // `<span>Hello</span> <span>World</span>` puts the only space between
        // the two words in its own text node, and dropping it exports
        // "HelloWorld". Kept when it actually occupies a line box; a collapsed
        // space between block elements has no rects and is correctly ignored.
        if (!text)
          return
        const range = document.createRange()
        range.selectNodeContents(node)
        const rects = Array.from(range.getClientRects())
        range.detach()
        // A node with no boxes is still reported. A newline inside a
        // `white-space: pre` block is exactly that, and it is the only record
        // of where one line of a code block ends and the next begins.
        if (!rects.length) {
          if (!text.includes('\n'))
            return
          nodes.push({ id: nextId++, parent, tag: '#text', style: -1, rect: { x: 0, y: 0, w: 0, h: 0 }, glyphRects: [], text })
          return
        }
        // Glyph rects, not the element box. A text box positioned from the
        // element rect lands offset by the padding and re-wraps.
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
        })
        return
      }

      if (node.nodeType !== 1)
        return

      const el = node as Element
      const id = nextId++
      const computed = getComputedStyle(el)

      // `display: none` has no box at all; `visibility: hidden` and
      // `opacity: 0` do. In `print=clicks` mode a not-yet-revealed v-click
      // element sits in the DOM at opacity 0, and without this it would be
      // exported onto every click step of the slide.
      if (computed.display === 'none' || computed.visibility === 'hidden')
        return
      const own = Number(computed.opacity)
      // CSS `opacity` does NOT inherit: a child of a half-transparent wrapper
      // computes 1 and would export fully opaque, because DrawingML has no
      // group opacity to stand in for the wrapper. So it is compounded here,
      // where the tree is still available.
      const effectiveOpacity = inheritedOpacity * (Number.isFinite(own) ? own : 1)
      if (effectiveOpacity === 0)
        return

      el.setAttribute(options.idAttribute, String(id))
      resolveStack(computed.fontFamily)

      const box = el.getBoundingClientRect()
      const record: any = {
        id,
        parent,
        tag: el.tagName.toUpperCase(),
        style: internStyle(el),
        rect: relative(box),
        // Document coordinates too. An element that overflows the slide is
        // captured as a page clip rather than as itself, and the clip needs a
        // page-space rectangle.
        pageRect: {
          x: box.left + window.scrollX,
          y: box.top + window.scrollY,
          w: box.width,
          h: box.height,
        },
      }
      if (effectiveOpacity < 1)
        record.opacity = effectiveOpacity
      if (fromShadowRoot)
        record.fromShadowRoot = true
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
        // Mermaid puts its node labels in <foreignObject> HTML with no <text>
        // element, so no PowerPoint renderer draws them. The normalizer routes
        // these to a picture instead of an empty diagram.
        record.hasForeignObject = true

      // `::marker` is a pseudo-element, so a list bullet has no text node and a
      // plain DOM walk drops every bullet glyph in the deck.
      //
      // Reading `content` alone is not enough: for an ordinary `<ul>` or `<ol>`
      // Chromium reports it as `normal` and leaves the glyph to
      // `list-style-type`, so a check for a non-normal `content` recovers ONLY
      // custom markers and still loses every default bullet in the deck.
      if (computed.display === 'list-item') {
        const marker = getComputedStyle(el, '::marker')
        const explicit = marker && marker.content
          && marker.content !== 'none'
          && marker.content !== 'normal'
        if (explicit) {
          record.marker = marker.content.replace(/^["']|["']$/g, '')
        }
        else if (computed.listStyleType !== 'none') {
          record.marker = markerGlyph(el, computed.listStyleType)
        }
      }

      nodes.push(record)

      // `::before` and `::after` have no DOM node, so a walk over the tree
      // cannot see them at all. Themes use them for decorative marks - the one
      // that prompted this was a corporate logo drawn as a background image on
      // an `::after` - and every one of those was silently missing from the
      // export.
      //
      // Only absolutely positioned pseudos are placeable: their box resolves
      // against the originating element when it is itself positioned. Anything
      // else takes part in inline or block flow, where its geometry is not
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
        const left = pseudo.left === 'auto'
          ? own.width - Number.parseFloat(pseudo.right || '0') - width
          : Number.parseFloat(pseudo.left)
        const top = pseudo.top === 'auto'
          ? own.height - Number.parseFloat(pseudo.bottom || '0') - height
          : Number.parseFloat(pseudo.top)

        const box = {
          left: own.left + left,
          top: own.top + top,
          width,
          height,
        }
        // DOCUMENT coordinates, not viewport ones. A clip screenshot is taken
        // later, after other captures have scrolled the page, and the print
        // route is far taller than the viewport once every click step has its
        // own container. Viewport coordinates read at measurement time are
        // stale by then, and Playwright answers "clipped area is empty",
        // which the caller swallows and the decoration vanishes.
        const pageRect = {
          x: box.left + window.scrollX,
          y: box.top + window.scrollY,
          w: width,
          h: height,
        }
        const text = pseudo.content.replace(/^["']|["']$/g, '')
        nodes.push({
          id: nextId++,
          parent: id,
          tag: which === '::before' ? '::BEFORE' : '::AFTER',
          style: internPseudo(pseudo),
          rect: relative(box),
          // Page coordinates as well: a pseudo has no element to point a
          // screenshot at, so it is captured by clipping the page instead.
          pageRect,
          ...(text && pseudo.content !== 'normal' ? { text } : {}),
        })
      }

      // Descend into the shadow root BEFORE the light children. Mermaid
      // renders into one, so `querySelector('.mermaid svg')` from the document
      // finds nothing at all.
      const shadow = (el as any).shadowRoot
      if (shadow) {
        for (const child of Array.from(shadow.childNodes) as Node[])
          walk(child, id, true, effectiveOpacity)
      }

      // Recurse through zero-sized boxes rather than pruning them. A cover
      // slide commonly hangs its title off a wrapper that measures 0 high.
      for (const child of Array.from(el.childNodes) as Node[])
        walk(child, id, fromShadowRoot, effectiveOpacity)
    }

    for (const child of Array.from(container.childNodes) as Node[])
      walk(child, -1, false, 1)

    slides.push({
      no,
      clickIndex: Number.isFinite(clickIndex) ? clickIndex : 0,
      // The exact id, not a pattern rebuilt from `no`. With `--with-clicks` a
      // slide has one container per step, and a prefix match plus `.first()`
      // hands every step a picture of step one.
      containerId: container.id,
      size: { w: containerRect.width, h: containerRect.height },
      // The slide's own background, which lives on the container and so is
      // never reached by a walk that starts at its children. Without it every
      // slide exports onto PowerPoint's default white, which on a dark theme
      // is light text on a white page.
      background: backgroundOf(container),
      nodes,
    })
  }

  return { slides, styles, fontResolution, unplaceablePseudos } as RawSnapshot
}
