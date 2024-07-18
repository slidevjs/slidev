import type { Plugin } from 'vite'
import { regexSlideSourceId } from './common'

/**
 * force reload slide component to ensure v-click resolves correctly
 */
export function createHmrPatchPlugin(): Plugin {
  return {
    name: 'slidev:slide-transform:post',
    transform(code, id) {
      if (!id.match(regexSlideSourceId))
        return
      const replaced = code.replace('if (_rerender_only)', 'if (false)')
      if (replaced !== code)
        return replaced
    },
  }
}
