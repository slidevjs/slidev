import type { ContextMenuItem } from '@slidev/types'
import type { ComputedRef } from 'vue'
import { shallowRef } from 'vue'
import setupContextMenu from '../setup/context-menu'

export const currentContextMenu = shallowRef<null | [number, number, ComputedRef<ContextMenuItem[]>]>(null)

export function openContextMenu(x: number, y: number) {
  currentContextMenu.value = [x, y, setupContextMenu()]
}

export function closeContextMenu() {
  currentContextMenu.value = null
}

export function onContextMenu(ev: MouseEvent) {
  if (ev.shiftKey || ev.defaultPrevented)
    return

  openContextMenu(ev.pageX, ev.pageY)
  ev.preventDefault()
  ev.stopPropagation()
}
