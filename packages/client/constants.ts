import type { ComputedRef, InjectionKey, Ref, UnwrapNestedRefs } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { RenderContext } from '@slidev/types'
import type { SlidevContext } from './modules/context'

export const injectionClicks: InjectionKey<Ref<number>> = Symbol('v-click-clicks')
export const injectionClicksElements: InjectionKey<Ref<(Element | string)[]>> = Symbol('v-click-clicks-elements')
export const injectionOrderMap: InjectionKey<Ref<Map<number, HTMLElement[]>>> = Symbol('v-click-clicks-order-map')
export const injectionClicksDisabled: InjectionKey<Ref<boolean>> = Symbol('v-click-clicks-disabled')
export const injectionSlideScale: InjectionKey<ComputedRef<number>> = Symbol('slidev-slide-scale')
export const injectionSlidevContext: InjectionKey<UnwrapNestedRefs<SlidevContext>> = Symbol('slidev-slidev-context')
export const injectionRoute: InjectionKey<RouteRecordRaw> = Symbol('slidev-route')
export const injectionSlideContext: InjectionKey<RenderContext> = Symbol('slidev-slide-context')

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
