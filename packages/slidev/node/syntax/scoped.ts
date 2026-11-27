import type MarkdownExit from 'markdown-exit'

const RE_STYLE_TAG_OPEN = /<style\b([^>]*)>/gi
const RE_SCOPED_ATTR = /\bscoped\b/i

export default function MarkdownItStyleScoped(md: MarkdownExit) {
  const addScoped = (html: string) => {
    return html.replace(RE_STYLE_TAG_OPEN, (match, attrs) => {
      if (RE_SCOPED_ATTR.test(attrs))
        return match
      return `<style scoped${attrs}>`
    })
  }

  const htmlBlock = md.renderer.rules.html_block!
  md.renderer.rules.html_block = async (...args) => addScoped(await htmlBlock(...args))

  const htmlInline = md.renderer.rules.html_inline!
  md.renderer.rules.html_inline = async (...args) => addScoped(await htmlInline(...args))
}
