import type { ContextMenuItem } from '@slidev/types'
import type { ComputedRef } from 'vue'
import { shallowRef } from 'vue'
import setupContextMenu from '../setup/context-menu'
import { configs, mode } from '../env'

export const currentContextMenu = shallowRef<null | {
  x: number
  y: number
  items: ComputedRef<ContextMenuItem[]>
}>(null)

export function openContextMenu(x: number, y: number) {
  currentContextMenu.value = {
    x,
    y,
    items: setupContextMenu(),
  }
}

export function closeContextMenu() {
  currentContextMenu.value = null
}

export function onContextMenu(ev: MouseEvent) {
  if (configs.contextMenu !== true && configs.contextMenu !== undefined && configs.contextMenu !== mode)
    return
  if (ev.shiftKey || ev.defaultPrevented)
    return

  openContextMenu(ev.pageX, ev.pageY)
  ev.preventDefault()
  ev.stopPropagation()
}
