import type { ClicksContext, RenderContext, SlideRoute } from '@slidev/types'
import type { ComputedRef, InjectionKey, Ref, UnwrapNestedRefs } from 'vue'
import type { SlidevContext } from './modules/context'

// Here we use string literal instead of symbols to make HMR more stable
// The value of the injections keys are implementation details, you should always use them with the reference to the constant instead of the value
export const injectionClicksContext = '$$slidev-clicks-context' as unknown as InjectionKey<Ref<ClicksContext>>
export const injectionCurrentPage = '$$slidev-page' as unknown as InjectionKey<Ref<number>>
export const injectionSlideElement = '$$slidev-slide-element' as unknown as InjectionKey<Ref<HTMLElement | null>>
export const injectionSlideScale = '$$slidev-slide-scale' as unknown as InjectionKey<ComputedRef<number>>
export const injectionSlidevContext = '$$slidev-context' as unknown as InjectionKey<UnwrapNestedRefs<SlidevContext>>
export const injectionRoute = '$$slidev-route' as unknown as InjectionKey<SlideRoute>
export const injectionRenderContext = '$$slidev-render-context' as unknown as InjectionKey<Ref<RenderContext>>
export const injectionFrontmatter = '$$slidev-fontmatter' as unknown as InjectionKey<Record<string, any>>
export const injectionSlideZoom = '$$slidev-slide-zoom' as unknown as InjectionKey<ComputedRef<number>>

export const CLASS_VCLICK_TARGET = 'slidev-vclick-target'
export const CLASS_VCLICK_HIDDEN = 'slidev-vclick-hidden'
export const CLASS_VCLICK_FADE = 'slidev-vclick-fade'
export const CLASS_VCLICK_GONE = 'slidev-vclick-gone'
export const CLASS_VCLICK_HIDDEN_EXP = 'slidev-vclick-hidden-explicitly'
export const CLASS_VCLICK_CURRENT = 'slidev-vclick-current'
export const CLASS_VCLICK_PRIOR = 'slidev-vclick-prior'
export const CLASS_VCLICK_DISPLAY_NONE = 'slidev-vclick-display-none'

export const CLICKS_MAX = 999999

export const TRUST_ORIGINS = [
  'localhost',
  '127.0.0.1',
]

export const FRONTMATTER_FIELDS = [
  'clicks',
  'clicksStart',
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
  'dragPos',
  'lang',
]

export const HEADMATTER_FIELDS = [
  ...FRONTMATTER_FIELDS,
  'theme',
  'titleTemplate',
  'info',
  'author',
  'keywords',
  'presenter',
  'browserExporter',
  'download',
  'exportFilename',
  'export',
  'highlighter',
  'lineNumbers',
  'monaco',
  'monacoTypesSource',
  'monacoTypesAdditionalPackages',
  'monacoRunAdditionalDeps',
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
  'contextMenu',
  'wakeLock',
  'seoMeta',
]
