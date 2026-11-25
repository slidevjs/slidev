import type { SlideElHandler } from './v-slide-el'
import { describe, expect, it, vi } from 'vitest'
import { applySlideEl, createVSlideElDirective } from './v-slide-el'

interface FakeElement {
  className: string
  classList: { add: (name: string) => void, contains: (name: string) => boolean }
  dataset: Record<string, string>
  parent: FakeElement | null
  children: FakeElement[]
  closest: (selector: string) => FakeElement | null
  querySelector: (selector: string) => FakeElement | null
  querySelectorAll: (selector: string) => FakeElement[]
}

function matches(node: FakeElement, selector: string) {
  const className = selector.startsWith('.')
    ? selector.slice(1)
    : selector
  return node.className.split(/\s+/).includes(className)
}

function walk(node: FakeElement): FakeElement[] {
  return node.children.flatMap(child => [
    child,
    ...walk(child),
  ])
}

function fakeElement(className = ''): FakeElement {
  const node: FakeElement = {
    className,
    classList: {
      add(name: string) {
        const parts = new Set(node.className.split(/\s+/).filter(Boolean))
        parts.add(name)
        node.className = [...parts].join(' ')
      },
      contains(name: string) {
        return matches(node, `.${name}`)
      },
    },
    dataset: {},
    parent: null,
    children: [],
    closest(selector: string) {
      let current: FakeElement | null = node
      while (current) {
        if (matches(current, selector))
          return current
        current = current.parent
      }
      return null
    },
    querySelector(selector: string) {
      return walk(node).find(child => matches(child, selector)) ?? null
    },
    querySelectorAll(selector: string) {
      return walk(node).filter(child => matches(child, selector))
    },
  }
  return node
}

function adopt(parent: FakeElement, ...children: FakeElement[]) {
  for (const child of children) {
    child.parent = parent
    parent.children.push(child)
  }
  return parent
}

function slideFixture() {
  const otherFoo = fakeElement('foo')
  const other = adopt(fakeElement('slidev-page'), otherFoo)
  const foo = fakeElement('foo')
  const itemA = fakeElement('item')
  const itemB = fakeElement('item')
  const host = fakeElement()
  const slide = adopt(fakeElement('slidev-page'), foo, itemA, itemB, host)
  adopt(fakeElement(), other, slide)
  return {
    slide,
    foo,
    itemA,
    itemB,
    host,
    otherFoo,
  }
}

describe('applySlideEl', () => {
  it('queries only the containing slide', () => {
    const { host, foo, otherFoo, itemA, itemB } = slideFixture()
    const callback: SlideElHandler = (el, $, $$) => {
      expect(el).toBe(host)
      expect($('.foo')).toBe(foo)
      expect($('.missing')).toBeNull()
      expect($$('.item')).toEqual([itemA, itemB])
      $('.foo')?.classList.add('bar')
    }
    applySlideEl(host as unknown as HTMLElement, callback)
    expect(foo.classList.contains('bar')).toBe(true)
    expect(otherFoo.classList.contains('bar')).toBe(false)
  })

  it('does nothing outside a slide or when the value is not a function', () => {
    const host = fakeElement()
    const spy = vi.fn()
    applySlideEl(host as unknown as HTMLElement, spy)
    applySlideEl(host as unknown as HTMLElement, 'nope')
    expect(spy).not.toHaveBeenCalled()
  })
})

interface MountedDirective {
  mounted?: (el: HTMLElement, binding: { value: unknown }) => void
  updated?: unknown
}

describe('createVSlideElDirective', () => {
  it('registers a mounted-only slide-el directive', () => {
    const directives = new Map<string, MountedDirective>()
    createVSlideElDirective().install({
      directive(name: string, def: MountedDirective) {
        directives.set(name, def)
      },
    } as any)

    const directive = directives.get('slide-el')
    expect(directive?.mounted).toBeTypeOf('function')
    expect(directive?.updated).toBeUndefined()

    const { host, foo } = slideFixture()
    directive!.mounted!(host as unknown as HTMLElement, {
      value: (_el: FakeElement, $: (selector: string) => FakeElement | null) => {
        $('.foo')!.dataset.touched = 'yes'
      },
    })
    expect(foo.dataset.touched).toBe('yes')
  })
})
