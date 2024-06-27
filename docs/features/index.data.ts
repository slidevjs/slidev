import { basename } from 'node:path'
import { createContentLoader } from 'vitepress'

export interface Feature {
  name: string
  title: string
  link: string
  excerpt: string
  depends: string[]
  relates: string[]
  derives: string[]
  since?: string
}

export default createContentLoader('features/*.md', {
  excerpt: true,
  includeSrc: true,
  transform(data) {
    const result: Record<string, Feature> = {}
    for (const md of data) {
      const name = basename(md.url, '.md')
      const title = md.src?.match(/^# (.*)$/m)?.[1]?.trim() ?? name
      result[name] = {
        name,
        title,
        link: `/features/${name}.html`,
        excerpt: md.excerpt ?? '',
        depends: md.frontmatter.depends ?? [],
        relates: md.frontmatter.relates ?? [],
        derives: md.frontmatter.derives ?? [],
        since: md.frontmatter.since,
      }
    }
    return result
  },
})

export declare const data: Record<string, Feature>
