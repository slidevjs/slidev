import type { Plugin } from 'vite'
import { regexSlideSourceId } from './common'

/**
 * force reload slide component to ensure v-click resolves correctly
 */
export function createHmrPatchPlugin(): Plugin {
  return {
    name: 'slidev:hmr-patch',
    transform(code, id) {
      if (!id.match(regexSlideSourceId))
        return
      return code.replace('if (_rerender_only)', 'if (false)')
    },
  }
}
