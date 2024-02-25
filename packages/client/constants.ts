import type { ComputedRef, InjectionKey, Ref, UnwrapNestedRefs } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { ClicksContext, RenderContext } from '@slidev/types'
import type { SlidevContext } from './modules/context'

// Here we use string literal instead of symbols to make HMR more stable
// The value of the injections keys are implementation details, you should always use them with the reference to the constant instead of the value
export const injectionClicksContext = '$$slidev-clicks-context' as unknown as InjectionKey<Ref<ClicksContext>>
export const injectionCurrentPage = '$$slidev-page' as unknown as InjectionKey<Ref<number>>
export const injectionSlideScale = '$$slidev-slide-scale' as unknown as InjectionKey<ComputedRef<number>>
export const injectionSlidevContext = '$$slidev-context' as unknown as InjectionKey<UnwrapNestedRefs<SlidevContext>>
export const injectionRoute = '$$slidev-route' as unknown as InjectionKey<RouteRecordRaw>
export const injectionRenderContext = '$$slidev-render-context' as unknown as InjectionKey<Ref<RenderContext>>
export const injectionActive = '$$slidev-active' as unknown as InjectionKey<Ref<boolean>>
export const injectionFrontmatter = '$$slidev-fontmatter' as unknown as InjectionKey<Record<string, any>>

export const CLASS_VCLICK_TARGET = 'slidev-vclick-target'
export const CLASS_VCLICK_HIDDEN = 'slidev-vclick-hidden'
export const CLASS_VCLICK_FADE = 'slidev-vclick-fade'
export const CLASS_VCLICK_GONE = 'slidev-vclick-gone'
export const CLASS_VCLICK_HIDDEN_EXP = 'slidev-vclick-hidden-explicitly'
export const CLASS_VCLICK_CURRENT = 'slidev-vclick-current'
export const CLASS_VCLICK_PRIOR = 'slidev-vclick-prior'

export const CLICKS_MAX = 999999

export const TRUST_ORIGINS = [
  'localhost',
  '127.0.0.1',
]

export const FRONTMATTER_FIELDS = [
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
  'zoom',
]

export const HEADMATTER_FIELDS = [
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
