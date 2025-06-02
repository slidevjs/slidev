import type { TypstSetup } from '@slidev/types'
import { loadSetups } from './load'

export default async function setupTypst(roots: string[]): Promise<Record<string, any>> {
  const options = await loadSetups<TypstSetup>(roots, 'typst.ts', [])
  return Object.assign(
    { strict: false },
    ...options,
  )
}