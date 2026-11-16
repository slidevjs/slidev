import type { ClicksContext } from '@slidev/types'
import type { RendererElement, RendererNode } from 'vue'
import { compileTemplate } from '@vue/compiler-sfc'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { compile, createRenderer, defineComponent, h, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import VAfter from '../packages/client/builtin/VAfter'
import VClick from '../packages/client/builtin/VClick'
import { createClicksContextBase } from '../packages/client/composables/useClicks'
import { injectionClicksContext } from '../packages/client/constants'
import { createVClickDirectives } from '../packages/client/modules/v-click'
import { transformVClickMount } from '../packages/slidev/node/vite/vClickMount'

vi.stubGlobal('__DEV__', true)

vi.mock('../packages/client/env', () => ({
  configs: {},
}))

// `.vue` files aren't compiled in this test. With a single `<v-click>` the gap is always 0.
vi.mock('../packages/client/builtin/VClickGap.vue', async () => {
  const { defineComponent } = await import('vue')
  return {
    default: defineComponent({
      render: () => null,
    }),
  }
})

function compileToCode(source: string) {
  const { code, errors } = compileTemplate({
    source,
    filename: 'slides.md',
    id: 'test',
    compilerOptions: {
      nodeTransforms: [transformVClickMount],
    },
  })
  expect(errors).toEqual([])
  return code
}

describe('v-click.mount template transform', () => {
  it('wraps the element in <v-click mount>', () => {
    const code = compileToCode(`<div v-click.mount="3" class="a">A</div>`)
    expect(code).toContain('_resolveComponent("v-click")')
    expect(code).toContain('mount: ""')
    expect(code).toContain('at: 3')
    expect(code).not.toContain('_resolveDirective("click")')
    expect(code).toMatchInlineSnapshot(`
      "import { createElementVNode as _createElementVNode, resolveComponent as _resolveComponent, withCtx as _withCtx, openBlock as _openBlock, createBlock as _createBlock } from "vue"

      export function render(_ctx, _cache) {
        const _component_v_click = _resolveComponent("v-click")

        return (_openBlock(), _createBlock(_component_v_click, {
          mount: "",
          at: 3
        }, {
          default: _withCtx(() => [...(_cache[0] || (_cache[0] = [
            _createElementVNode("div", { class: "a" }, "A", -1 /* CACHED */)
          ]))]),
          _: 1 /* STABLE */
        }))
      }"
    `)
  })

  it('keeps the default value, arrays and relative values', () => {
    expect(compileToCode(`<div v-click.mount>A</div>`)).not.toContain('at:')
    expect(compileToCode(`<div v-click.mount="[3, 5]">A</div>`)).toContain('at: [3, 5]')
    expect(compileToCode(`<div v-click.mount="'+2'">A</div>`)).toContain(`at: '+2'`)
  })

  it('supports .hide, v-after and v-click-hide', () => {
    const hide = compileToCode(`<div v-click.mount.hide="3">A</div>`)
    expect(hide).toContain('hide: ""')
    expect(hide).toContain('at: 3')

    const after = compileToCode(`<div v-after.mount>A</div>`)
    expect(after).toContain('at: "+0"')
    expect(after).not.toContain('hide:')

    expect(compileToCode(`<div v-after.mount.hide>A</div>`)).toContain('hide: ""')
    expect(compileToCode(`<div v-click-hide.mount="2">A</div>`)).toContain('hide: ""')
  })

  it('leaves v-click without .mount untouched', () => {
    const code = compileToCode(`<div v-click="3">A</div><div v-click.hide>B</div>`)
    expect(code).toContain('_resolveDirective("click")')
    expect(code).not.toContain('_resolveComponent("v-click")')
  })

  it('moves v-for, v-if and key to the wrapper', () => {
    const forCode = compileToCode(`<div v-for="i in items" :key="i" v-click.mount>{{ i }}</div>`)
    expect(forCode).toMatch(/_renderList\(_ctx\.items, \(i\) => \{\s+return \(_openBlock\(\), _createBlock\(_component_v_click, \{\s+mount: "",\s+key: i\s+\}/)

    const ifCode = compileToCode(`<div v-if="ok" v-click.mount>A</div><p v-else>B</p>`)
    expect(ifCode).toMatch(/\(_ctx\.ok\)\s+\? \(_openBlock\(\), _createBlock\(_component_v_click/)
  })

  it('keeps the other props and handlers on the element, transformed once', () => {
    const code = compileToCode(`<div v-click.mount="step" :class="cls" @vue:mounted="onShow()">A</div>`)
    expect(code).toContain('at: _ctx.step')
    expect(code).toContain('class: _normalizeClass(_ctx.cls)')
    expect(code).toContain('onVnodeMounted')
    expect(code).not.toContain('_ctx._ctx')
  })

  it('handles nested elements and slots', () => {
    const code = compileToCode(`<Foo><template #a><span v-click.mount="2">A</span></template></Foo><section><p v-click.mount>B</p></section>`)
    expect(code.match(/_component_v_click,/g)).toHaveLength(2)
  })
})

// A tiny in-memory renderer, so components really mount and unmount without a DOM
interface TestNode extends RendererNode {
  tag: string
  text: string
  parent: TestNode | null
  children: TestNode[]
  props: Record<string, any>
  dataset: Record<string, string>
  classList: {
    add: (c: string) => void
    remove: (c: string) => void
    toggle: (c: string, force?: boolean) => void
    contains: (c: string) => boolean
    forEach: (fn: (c: string) => void) => void
  }
}

function createNode(tag: string, text = ''): TestNode {
  const classes = new Set<string>()
  return {
    tag,
    text,
    parent: null,
    children: [],
    props: {},
    dataset: {},
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      toggle: (c, force = !classes.has(c)) => force
        ? classes.add(c)
        : classes.delete(c),
      contains: c => classes.has(c),
      forEach: fn => [...classes].forEach(fn),
    },
  }
}

function remove(child: TestNode) {
  const parent = child.parent
  if (parent) {
    parent.children.splice(parent.children.indexOf(child), 1)
    child.parent = null
  }
}

const { createApp } = createRenderer<TestNode, TestNode & RendererElement>({
  createElement: tag => createNode(tag),
  createText: text => createNode('#text', text),
  createComment: text => createNode('#comment', text),
  setText: (node, text) => {
    node.text = text
  },
  setElementText: (node, text) => {
    node.children.forEach(c => c.parent = null)
    node.children = text
      ? [
          Object.assign(createNode('#text', text), { parent: node }),
        ]
      : []
  },
  insert: (child, parent, anchor) => {
    remove(child)
    const idx = anchor
      ? parent.children.indexOf(anchor)
      : -1
    if (idx === -1)
      parent.children.push(child)
    else
      parent.children.splice(idx, 0, child)
    child.parent = parent
  },
  remove,
  parentNode: node => node.parent,
  nextSibling: (node) => {
    const siblings = node.parent?.children ?? []
    return siblings[siblings.indexOf(node) + 1] ?? null
  },
  patchProp: (el, key, _prev, next) => {
    el.props[key] = next
  },
})

function findByText(node: TestNode, text: string): TestNode | undefined {
  if (node.children.length === 1 && node.children[0].tag === '#text' && node.children[0].text === text)
    return node
  for (const child of node.children) {
    const found = findByText(child, text)
    if (found)
      return found
  }
}

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach(fn => fn())
})

async function mountSlide(template: string) {
  const current = ref(0)
  const clicks = createClicksContextBase(current)
  const log: string[] = []
  const mounted = new Set<string>()
  const warnings: string[] = []
  // e.g. "[slidev] ClicksContext: Unexpected register after mounted"
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(msg => warnings.push(String(msg)))

  const Probe = defineComponent({
    props: {
      name: { type: String, required: true },
    },
    setup(props) {
      onMounted(() => {
        log.push(`mount ${props.name}`)
        mounted.add(props.name)
      })
      onUnmounted(() => {
        log.push(`unmount ${props.name}`)
        mounted.delete(props.name)
      })
      return () => h('span', props.name)
    },
  })

  const Slide = defineComponent({
    render: compile(template, {
      prefixIdentifiers: true,
      nodeTransforms: [transformVClickMount],
    }),
  })

  const Root = defineComponent({
    setup() {
      clicks.setup()
      return () => h(Slide)
    },
  })

  const app = createApp(Root)
  app.provide(injectionClicksContext, shallowRef<ClicksContext>(clicks))
  app.component('VClick', VClick)
  app.component('VAfter', VAfter)
  app.component('Probe', Probe)
  app.config.globalProperties.$log = log
  app.use(createVClickDirectives())
  app.config.warnHandler = (msg) => {
    warnings.push(msg)
  }
  const root = createNode('root')
  app.mount(root)
  cleanups.push(() => {
    app.unmount()
    consoleWarn.mockRestore()
  })
  await nextTick()

  async function go(n: number) {
    clicks.current = n
    await nextTick()
    expect(warnings).toEqual([])
    return [...mounted].sort()
  }

  return {
    clicks,
    log,
    mounted,
    go,
    find: (text: string) => findByText(root, text),
    unmount: () => cleanups.pop()?.(),
  }
}

describe('v-click.mount at runtime', () => {
  it('mounts on the click, with the same positions as v-click', async () => {
    const { clicks, log, go } = await mountSlide(`
      <div v-click>first</div>
      <Probe name="B" v-click.mount />
      <Probe name="C" v-after.mount />
      <Probe name="D" v-click.mount="[3, 5]" />
      <Probe name="E" v-click.mount.hide="3" />
      <Probe name="F" v-click.mount="'+1'" />
    `)

    // same click count as with the plain directives: first=1, B=2, C=2, D=3..4, E=3, F=3
    expect(clicks.total).toBe(5)
    expect(log).toEqual(['mount E'])

    expect(await go(1)).toEqual(['E'])
    expect(await go(2)).toEqual(['B', 'C', 'E'])
    expect(await go(3)).toEqual(['B', 'C', 'D', 'F'])
    expect(await go(4)).toEqual(['B', 'C', 'D', 'F'])
    expect(await go(5)).toEqual(['B', 'C', 'F'])

    // going back unmounts again
    expect(await go(1)).toEqual(['E'])
    expect(log.filter(l => l.endsWith(' D'))).toEqual(['mount D', 'unmount D'])
    expect(log.filter(l => l.endsWith(' E'))).toEqual(['mount E', 'unmount E', 'mount E'])
  })

  it('fires @vue:mounted only when the click is reached', async () => {
    const { go, log } = await mountSlide(`
      <div v-click>first</div>
      <div v-click.mount @vue:mounted="$log.push('vnode mounted')" @vue:unmounted="$log.push('vnode unmounted')">A</div>
    `)
    expect(log).toEqual([])
    await go(1)
    expect(log).toEqual([])
    await go(2)
    expect(log).toEqual(['vnode mounted'])
    await go(1)
    expect(log).toEqual(['vnode mounted', 'vnode unmounted'])
  })

  it('supports the component props', async () => {
    const { clicks, go } = await mountSlide(`
      <v-click mount><Probe name="A" /></v-click>
      <v-after mount><Probe name="B" /></v-after>
      <v-click mount hide :at="[2, 4]"><Probe name="C" /></v-click>
      <v-click><span>plain</span></v-click>
    `)
    // A=1, B=1, C hidden at 2..3, plain=2
    expect(clicks.total).toBe(4)
    expect(await go(0)).toEqual(['C'])
    expect(await go(1)).toEqual(['A', 'B', 'C'])
    expect(await go(2)).toEqual(['A', 'B'])
    expect(await go(3)).toEqual(['A', 'B'])
    expect(await go(4)).toEqual(['A', 'B', 'C'])
  })

  it('passes the hide prop of <v-after> to the directive', async () => {
    const { go, find } = await mountSlide(`
      <div v-click>A</div>
      <v-after hide><span>B</span></v-after>
    `)
    expect(find('B')!.classList.contains('slidev-vclick-hidden')).toBe(false)
    await go(1)
    expect(find('B')!.classList.contains('slidev-vclick-hidden')).toBe(true)
  })

  it('mounts everything when all clicks are shown, like print mode', async () => {
    const { go } = await mountSlide(`
      <Probe name="A" v-click.mount />
      <Probe name="B" v-click.mount="4" />
      <Probe name="C" v-click.mount.hide />
    `)
    expect(await go(999999)).toEqual(['A', 'B'])
  })

  it('unregisters the click when the slide unmounts', async () => {
    const { clicks, unmount } = await mountSlide(`<Probe name="A" v-click.mount="2" />`)
    expect(clicks.maxMap.size).toBe(1)
    unmount()
    expect(clicks.maxMap.size).toBe(0)
  })
})
