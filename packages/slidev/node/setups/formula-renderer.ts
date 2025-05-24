import type { HeadmatterConfig } from '@slidev/types'
import setupKatex from './katex'
import setupTypst from './typst'

export default async function setupFormulaRenderer(roots: string[], headmatter: HeadmatterConfig) {
  const renderer = headmatter.formulaRenderer || 'katex'
  
  if (renderer === 'typst')
    return { renderer, options: await setupTypst(roots) }
  
  // Default to KaTeX
  return { renderer, options: await setupKatex(roots) }
}