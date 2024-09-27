import type { App } from 'vue'
import type { DragElementState } from '../composables/useDragElements'
import { watch } from 'vue'
import { useDragElement } from '../composables/useDragElements'

export function createVDragDirective() {
  return {
    install(app: App) {
      app.directive<HTMLElement & { draggingState: DragElementState }>('drag', {
        // @ts-expect-error extra prop
        name: 'v-drag',

        created(el, binding, vnode) {
          const state = useDragElement(binding, binding.value, vnode.props?.markdownSource)
          if (vnode.props) {
            vnode.props = { ...vnode.props }
            delete vnode.props.markdownSource
          }
          state.container.value = el
          el.draggingState = state
          el.dataset.dragId = state.dragId
          state.watchStopHandles.push(
            watch(state.containerStyle, (style) => {
              for (const [k, v] of Object.entries(style)) {
                if (v)
                  el.style[k as any] = v as any
              }
            }, { immediate: true }),
          )
          el.addEventListener('dblclick', state.startDragging)
        },
        mounted(el) {
          el.draggingState.mounted()
        },
        unmounted(el) {
          const state = el.draggingState
          state.unmounted()
          el.removeEventListener('dblclick', state.startDragging)
          state.watchStopHandles.forEach(fn => fn())
        },
      })
    },
  }
}
