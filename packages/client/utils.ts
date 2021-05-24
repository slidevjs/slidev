import type { RouteRecordRaw } from 'vue-router'

const REGEX_HTML_TAGS_IN_MARKDOWN = /(?<!\\)<(.*?)[^\\]>/g

export function getSlideClass(route?: RouteRecordRaw) {
  const no = route?.meta?.slide?.no
  if (no != null)
    return `slidev-page-${no}`
  return ''
}

export function stripMarkdownHTMLTags(markdown: string) {
  return markdown.replace(REGEX_HTML_TAGS_IN_MARKDOWN, '')
}
