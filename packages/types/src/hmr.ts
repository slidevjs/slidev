import type { SlideInfo } from './types'

declare module 'vite' {
  interface CustomEventMap {
    'slidev:update-slide': {
      id: number
      data: SlideInfo
    }
    'slidev:update-note': {
      id: number
      note: string
      noteHTML: string
    }
  }
}
