/* __imports__ */

import type { MermaidOptions } from '@slidev/types'
import { defineMermaidSetup } from '@slidev/types'

export default defineMermaidSetup(() => {
  // eslint-disable-next-line prefer-const
  let injection_return: MermaidOptions = {
    theme: 'default',
  }

  /* __injections__ */

  return injection_return
})
