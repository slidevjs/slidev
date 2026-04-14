import type MarkdownExit from 'markdown-exit'

const RE_DIGITS_ONLY = /^\d+$/

export default function MarkdownItLink(md: MarkdownExit) {
  const defaultRender = md.renderer.rules.link_open
    ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx]
    const hrefIndex = token.attrIndex('href')
    const attr = token.attrs?.[hrefIndex]
    const href = attr?.[1] ?? ''
    if ('./#'.includes(href[0]) || RE_DIGITS_ONLY.test(href)) {
      token.tag = 'Link'
      attr![0] = 'to'

      for (let i = idx + 1; i < tokens.length; i++) {
        if (tokens[i].type === 'link_close') {
          tokens[i].tag = 'Link'
          break
        }
      }
    }
    else if (token.attrGet('target') == null) {
      token.attrPush(['target', '_blank'])
    }
    return defaultRender(tokens, idx, options, env, self)
  }
}
