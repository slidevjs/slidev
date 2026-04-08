import type { Highlighter } from 'shiki'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import { createHighlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | undefined

const LANGS = [
  'typescript',
  'javascript',
  'python',
  'html',
  'css',
  'json',
  'yaml',
  'bash',
  'vue',
  'markdown',
] as const

const THEMES = [
  'vitesse-dark',
  'vitesse-light',
] as const

export async function getShikiHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      engine: createJavaScriptRegexEngine(),
      langs: [...LANGS],
      themes: [...THEMES],
    })
  }
  return highlighterPromise
}

export async function getMarkdownItShikiPlugin() {
  const [{ default: markdownItShiki }, highlighter] = await Promise.all([
    import('@shikijs/markdown-it'),
    getShikiHighlighter(),
  ])
  return markdownItShiki(highlighter, {
    theme: 'vitesse-light',
  })
}
