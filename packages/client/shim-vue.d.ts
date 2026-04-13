declare module 'vue' {
  import type { ShallowUnwrapRef } from 'vue'

  type SlideContext = ShallowUnwrapRef<import('./context').SlideContext>
  interface ComponentCustomProperties extends SlideContext {
  }
}

declare module 'vue-router' {
  import type { TransitionGroupProps } from 'vue'

  interface RouteMeta {
    // inherited from frontmatter
    layout?: string
    name?: string
    class?: string
    clicks?: number
    transition?: string | TransitionGroupProps | undefined
    preload?: boolean

    // slide info
    slide?: Omit<import('@slidev/types').SlideInfo, 'source'> & {
      noteHTML: string
      filepath: string
      start: number
      id: number
      no: number
    }

    // private fields
    __clicksContext: import('@slidev/types').ClicksContext | null
    __preloaded?: boolean
  }
}

export {}
