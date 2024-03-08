import type { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '../options'

const customElements = new Set([
  // katex
  'annotation',
  'math',
  'menclose',
  'mfrac',
  'mglyph',
  'mi',
  'mlabeledtr',
  'mn',
  'mo',
  'mover',
  'mpadded',
  'mphantom',
  'mroot',
  'mrow',
  'mspace',
  'msqrt',
  'mstyle',
  'msub',
  'msubsup',
  'msup',
  'mtable',
  'mtd',
  'mtext',
  'mtr',
  'munder',
  'munderover',
  'semantics',
])

export async function createVuePlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
): Promise<Plugin[]> {
  const {
    vue: vueOptions = {},
    vuejsx: vuejsxOptions = {},
  } = pluginOptions

  const VuePlugin = Vue({
    include: [/\.vue$/, /\.md$/],
    exclude: [],
    template: {
      compilerOptions: {
        isCustomElement(tag) {
          return customElements.has(tag)
        },
      },
      ...vueOptions?.template,
    },
    ...vueOptions,
  })
  const VueJsxPlugin = VueJsx(vuejsxOptions)

  return [
    VueJsxPlugin,
    VuePlugin,
  ]
}
