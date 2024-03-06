declare module 'vue' {
  import type { UnwrapNestedRefs } from 'vue'

  interface ComponentCustomProperties {
    $slidev: UnwrapNestedRefs<import('./modules/context').SlidevContext>
  }
}

declare module 'vue-router' {
  import type { TransitionGroupProps } from 'vue'

  interface RouteMeta {
    // inherited from frontmatter
    layout: string
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
    __clicksContext: null | import('@slidev/types').ClicksContext
    __preloaded?: boolean
  }
}

export {}
