import type { SlideInfo } from './types'

declare module 'vite' {
  interface CustomEventMap {
    'slidev:update-slide': {
      no: number
      data: SlideInfo
    }
    'slidev:update-note': {
      no: number
      note: string
      noteHTML: string
    }
  }
}
