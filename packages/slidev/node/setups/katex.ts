import type { KatexSetup } from '@slidev/types'
import type { KatexOptions } from 'katex'
import { loadSetups } from './load'

export default async function setupKatex(roots: string[]): Promise<KatexOptions> {
  const options = await loadSetups<KatexSetup>(roots, 'katex.ts', [])
  return Object.assign(
    { strict: false },
    ...options,
  )
}
