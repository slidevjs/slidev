import { ref } from 'vue'

export const contextMenuPos = ref<null | string>(null)

export function openContextMenu(x: number, y: number) {
  contextMenuPos.value = `left: ${x}px;top: ${y}px`
}

export function closeContextMenu() {
  contextMenuPos.value = null
}
