import type { Component } from 'vue'

type ContextMenuOption = {
  action: () => void
  disabled?: boolean
} & (
  | {
    small?: false
    icon?: Component | string
    label: string | Component
  }
  | {
    small: true
    icon: Component | string
    label: string
  }
  )

export type ContextMenuItem = ContextMenuOption | 'separator'
