import type { VNode } from 'vue'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, provide, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import {
  injectionClicksContext,
  injectionCurrentPage,
  injectionFrontmatter,
  injectionRenderContext,
  injectionSlidevContext,
} from '../constants'
import VClicks from './VClicks'

function renderClicks(props: Record<string, unknown>, slot: () => VNode[]) {
  const Root = defineComponent({
    setup() {
      provide(injectionClicksContext, ref({
        register() {},
        unregister() {},
        get currentOffset() {
          return 0
        },
      }) as never)
      provide(injectionSlidevContext, { nav: {} } as never)
      provide(injectionCurrentPage, ref(1))
      provide(injectionRenderContext, ref('slide'))
      provide(injectionFrontmatter, {})
      return () => h(VClicks, props, slot)
    },
  })

  const app = createSSRApp(Root)
  app.directive('click', {
    getSSRProps(binding) {
      return {
        'data-at': String(binding.value),
      }
    },
  })
  return renderToString(app)
}

/** Tags that received a click step, in document order, as `tag:at`. */
function clickSteps(html: string) {
  return [
    ...html.matchAll(/data-at="([^"]*)"/g),
  ].map((match) => {
    const tagStart = html.lastIndexOf('<', match.index)
    const tag = /^[a-z0-9]+/.exec(html.slice(tagStart + 1))?.[0] ?? '?'
    return `${tag}:${match[1]}`
  })
}

describe('v-clicks lists and tables', () => {
  it('reveals nested list items and table rows mixed with paragraphs', async () => {
    const html = await renderClicks({ lists: 2, tables: 1 }, () => [
      h('p', 'Here are the first priority items:'),
      h('ul', [
        h('li', 'Item 1'),
        h('li', 'Item 2'),
        h('li', 'Item 3'),
      ]),
      h('p', 'And others group of items:'),
      h('ul', [
        h('li', [
          'Medium:',
          h('ul', [
            h('li', 'Sub item 1'),
            h('li', 'Sub item 2'),
          ]),
        ]),
        h('li', [
          'Minor:',
          h('ul', [
            h('li', 'Sub item 3'),
          ]),
        ]),
      ]),
      h('table', [
        h('thead', [
          h('tr', [
            h('th', 'Name'),
            h('th', 'Priority'),
          ]),
        ]),
        h('tbody', [
          h('tr', [
            h('td', 'Alpha'),
            h('td', 'High'),
          ]),
          h('tr', [
            h('td', 'Beta'),
            h('td', 'Low'),
          ]),
        ]),
      ]),
    ])

    expect(clickSteps(html)).toEqual([
      'p:+1',
      'li:+1',
      'li:+1',
      'li:+1',
      'p:+1',
      'li:+1',
      'li:+1',
      'li:+1',
      'li:+1',
      'li:+1',
      'tr:+1',
      'tr:+1',
    ])
    expect(html).not.toMatch(/<th[^>]*data-at=/)
  })

  it('stops at the requested list depth', async () => {
    const slot = () => [
      h('ul', [
        h('li', [
          'Parent',
          h('ul', [
            h('li', 'Child'),
          ]),
        ]),
      ]),
    ]

    const shallow = await renderClicks({ lists: 1 }, slot)
    expect(clickSteps(shallow)).toEqual(['li:+1'])
    expect(shallow).not.toMatch(/<li[^>]*data-at="\+1"[^>]*>Child/)

    const nested = await renderClicks({ lists: '2' }, slot)
    expect(clickSteps(nested)).toEqual(['li:+1', 'li:+1'])
  })

  it('reveals body cells when tables is 2', async () => {
    const html = await renderClicks({ tables: 2 }, () => [
      h('p', 'Scores'),
      h('table', [
        h('tbody', [
          h('tr', [
            h('td', 'A'),
            h('td', 'B'),
          ]),
          h('tr', [
            h('td', 'C'),
          ]),
        ]),
      ]),
    ])

    expect(clickSteps(html)).toEqual([
      'p:+1',
      'td:+1',
      'td:+1',
      'td:+1',
    ])
  })

  it('keeps a lone list on the depth prop', async () => {
    const slot = () => [
      h('ul', [
        h('li', 'A'),
        h('li', [
          h('ul', [
            h('li', 'B'),
          ]),
        ]),
      ]),
    ]

    expect(clickSteps(await renderClicks({ depth: 1 }, slot))).toEqual(['li:+1', 'li:+1'])
    expect(clickSteps(await renderClicks({ depth: 2 }, slot))).toEqual(['li:+1', 'li:+1', 'li:+1'])
  })

  it('treats a whole list as one step when lists is omitted', async () => {
    const html = await renderClicks({}, () => [
      h('p', 'Intro'),
      h('ul', [
        h('li', 'Item 1'),
        h('li', 'Item 2'),
      ]),
    ])

    expect(clickSteps(html)).toEqual(['p:+1', 'ul:+1'])
  })

  it('groups steps with every', async () => {
    const html = await renderClicks({ every: 2 }, () => [
      h('ul', [
        h('li', '1'),
        h('li', '2'),
        h('li', '3'),
        h('li', '4'),
      ]),
    ])

    expect(clickSteps(html)).toEqual(['li:+1', 'li:+0', 'li:+1', 'li:+0'])
  })
})
