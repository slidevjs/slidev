import { defineComponent } from 'vue'

const EmptyComponent = defineComponent(() => () => [])

export const GlobalTop = EmptyComponent
export const GlobalBottom = EmptyComponent

export const SlideTop = EmptyComponent
export const SlideBottom = EmptyComponent
