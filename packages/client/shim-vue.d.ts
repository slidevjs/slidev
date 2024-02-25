declare module 'vue' {
  import type { UnwrapNestedRefs } from 'vue'
  import type { SlidevContext } from './modules/context'

  interface ComponentCustomProperties {
    $slidev: UnwrapNestedRefs<SlidevContext>
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    // inherited from frontmatter
    layout: string
    name?: string
    class?: string
    clicks?: number
    transition?: string | TransitionGroupProps | undefined
    preload?: boolean

    // slide info
    slide?: Omit<SlideInfo, 'source'> & {
      noteHTML: string
      filepath: string
      start: number
      id: number
      no: number
    }

    // private fields
    __clicksContext: null | ClicksContext
    __preloaded?: boolean
  }
}

export {}
