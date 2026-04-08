import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'

const RE_VUE_EXT = /\.vue$/
const RE_VUE_QUERY_VUE = /\.vue\?vue/
const RE_VUE_QUERY_V = /\.vue\?v=/
const RE_MD_EXT = /\.md$/
const RE_MD_QUERY_VUE = /\.md\?vue/

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
  _options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
): Promise<Plugin[]> {
  const {
    vue: vueOptions = {},
    vuejsx: vuejsxOptions = {},
  } = pluginOptions

  const VuePlugin = Vue({
    include: [RE_VUE_EXT, RE_VUE_QUERY_VUE, RE_VUE_QUERY_V, RE_MD_EXT, RE_MD_QUERY_VUE],
    exclude: [],
    ...vueOptions,
    template: {
      ...vueOptions?.template,
      compilerOptions: {
        ...vueOptions?.template?.compilerOptions,
        isCustomElement(tag) {
          return customElements.has(tag) || vueOptions?.template?.compilerOptions?.isCustomElement?.(tag)
        },
      },
    },
  })
  const VueJsxPlugin = VueJsx(vuejsxOptions)

  return [
    VueJsxPlugin,
    VuePlugin,
  ]
}
