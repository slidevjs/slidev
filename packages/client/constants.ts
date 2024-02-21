import type { ComputedRef, InjectionKey, Ref, UnwrapNestedRefs } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { ClicksContext, RenderContext } from '@slidev/types'
import { objectOmit } from '@vueuse/core'
import type { SlidevContext } from './modules/context'

export const injectionClicksContext: InjectionKey<Ref<ClicksContext>> = Symbol('slidev-clicks-context')
export const injectionCurrentPage: InjectionKey<Ref<number>> = Symbol('slidev-page')
export const injectionSlideScale: InjectionKey<ComputedRef<number>> = Symbol('slidev-slide-scale')
export const injectionSlidevContext: InjectionKey<UnwrapNestedRefs<SlidevContext>> = Symbol('slidev-slidev-context')
export const injectionRoute: InjectionKey<RouteRecordRaw> = Symbol('slidev-route')
export const injectionRenderContext: InjectionKey<Ref<RenderContext>> = Symbol('slidev-render-context')
export const injectionActive: InjectionKey<Ref<boolean>> = Symbol('slidev-active')
export const injectionFrontmatter: InjectionKey<Record<string, any>> = Symbol('slidev-fontmatter')

export const CLASS_VCLICK_TARGET = 'slidev-vclick-target'
export const CLASS_VCLICK_HIDDEN = 'slidev-vclick-hidden'
export const CLASS_VCLICK_FADE = 'slidev-vclick-fade'
export const CLASS_VCLICK_GONE = 'slidev-vclick-gone'
export const CLASS_VCLICK_HIDDEN_EXP = 'slidev-vclick-hidden-explicitly'
export const CLASS_VCLICK_CURRENT = 'slidev-vclick-current'
export const CLASS_VCLICK_PRIOR = 'slidev-vclick-prior'

export const TRUST_ORIGINS = [
  'localhost',
  '127.0.0.1',
]

const FRONTMATTER_FIELDS = [
  'clicks',
  'disabled',
  'hide',
  'hideInToc',
  'layout',
  'level',
  'preload',
  'routeAlias',
  'src',
  'title',
  'transition',
]

const HEADMATTER_FIELDS = [
  ...FRONTMATTER_FIELDS,
  'theme',
  'titleTemplate',
  'info',
  'author',
  'keywords',
  'presenter',
  'download',
  'exportFilename',
  'export',
  'highlighter',
  'lineNumbers',
  'monaco',
  'remoteAssets',
  'selectable',
  'record',
  'colorSchema',
  'routerMode',
  'aspectRatio',
  'canvasWidth',
  'themeConfig',
  'favicon',
  'plantUmlServer',
  'fonts',
  'defaults',
  'drawings',
  'htmlAttrs',
  'mdc',
]

export function filterFrontmatter(frontmatter: Record<string, any>, pageNo: number) {
  return {
    ...objectOmit(frontmatter, pageNo === 0 ? HEADMATTER_FIELDS : FRONTMATTER_FIELDS),
    frontmatter,
  }
}
