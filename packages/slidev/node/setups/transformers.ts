import type { TransformersSetup, TransformersSetupReturn } from '@slidev/types'
import { loadSetups } from './load'

export default async function setupTransformers(roots: string[]) {
  const returns = await loadSetups<TransformersSetup>(roots, 'transformers.ts', [])
  const result: TransformersSetupReturn = {
    pre: [],
    preCodeblock: [],
    postCodeblock: [],
    post: [],
  }
  for (const r of [...returns].reverse()) {
    if (r.pre)
      result.pre.push(...r.pre)
    if (r.preCodeblock)
      result.preCodeblock.push(...r.preCodeblock)
  }
  for (const r of returns) {
    if (r.postCodeblock)
      result.postCodeblock.push(...r.postCodeblock)
    if (r.post)
      result.post.push(...r.post)
  }
  return result
}
