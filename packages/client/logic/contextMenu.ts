import { ref } from 'vue'

export const contextMenuPos = ref<null | [number, number]>(null)

export function openContextMenu(x: number, y: number) {
  contextMenuPos.value = [x, y]
}

export function closeContextMenu() {
  contextMenuPos.value = null
}
