import { defineShortcutsSetup } from '@slidev/types'

export default defineShortcutsSetup(({ nav, defaultShortcuts }) => {
  defaultShortcuts.length = 0

  return [
    {
      key: 'Escape',
      fn: () => nav.toggleOverview(),
    },
  ]
})
