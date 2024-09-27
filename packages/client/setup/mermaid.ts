import type { MermaidConfig } from 'mermaid'
import setups from '#slidev/setups/mermaid'
import { createSingletonPromise } from '@antfu/utils'

export default createSingletonPromise(async () => {
  const setupReturn: MermaidConfig = {
    theme: 'default',
  }

  for (const setup of setups)
    Object.assign(setupReturn, await setup())

  return setupReturn
})
