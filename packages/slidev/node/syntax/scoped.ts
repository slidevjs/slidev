import type MarkdownExit from 'markdown-exit'

export default function MarkdownItStyleScoped(md: MarkdownExit) {
  const addScoped = (html: string) => {
    return html.replace(/<style\b([^>]*)>/gi, (match, attrs) => {
      if (/\bscoped\b/i.test(attrs))
        return match
      return `<style scoped${attrs}>`
    })
  }

  const htmlBlock = md.renderer.rules.html_block!
  md.renderer.rules.html_block = async (...args) => addScoped(await htmlBlock(...args))

  const htmlInline = md.renderer.rules.html_inline!
  md.renderer.rules.html_inline = async (...args) => addScoped(await htmlInline(...args))
}
