const RE_FRONTMATTER_BLOCK = /^---\n([\s\S]*?)\n---(?:\n|$)/

export function parseSideEditorContent(content: string) {
  let frontmatterRaw: string | undefined
  const contentOnly = content.trim().replace(RE_FRONTMATTER_BLOCK, (_, f) => {
    frontmatterRaw = f
    return ''
  })

  return {
    content: contentOnly,
    frontmatterRaw,
  }
}
