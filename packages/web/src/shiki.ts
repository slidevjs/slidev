import { createHighlighter } from 'shiki/index.mjs'

export { shikiToMonaco } from '@shikijs/monaco'
export const languages = ['markdown', 'vue', 'javascript', 'typescript', 'html', 'css']
export const themes = [
  'vitesse-dark',
  'vitesse-light',
]
export const shiki = createHighlighter({
  themes: [
    import('shiki/themes/vitesse-dark.mjs'),
    import('shiki/themes/vitesse-light.mjs'),
  ],
  langs: [
    import('shiki/langs/markdown.mjs'),
    import('shiki/langs/vue.mjs'),
    import('shiki/langs/javascript.mjs'),
    import('shiki/langs/typescript.mjs'),
    import('shiki/langs/html.mjs'),
    import('shiki/langs/css.mjs'),
  ],
})
let highlight: any
export async function getHighlighter() {
  if (highlight)
    return highlight
  const highlighter = await shiki
  highlight = (code: string, lang: string, options: any) => highlighter.codeToHtml(code, {
    lang,
    themes: {
      dark: 'vitesse-dark',
      light: 'vitesse-light',
    },
    defaultColor: false,
    ...options,
  })
  return highlight
}
