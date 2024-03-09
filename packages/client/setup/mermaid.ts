import type { MermaidOptions } from '@slidev/types'
import { defineMermaidSetup } from '@slidev/types'
import setups from '#slidev/setups/mermaid'

export default defineMermaidSetup(() => {
  const setupReturn: MermaidOptions = {
    theme: 'default',
  }

  for (const setup of setups)
    Object.assign(setupReturn, setup())

  return setupReturn
})
