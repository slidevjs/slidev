import { basename } from 'node:path'
import { createContentLoader } from 'vitepress'

export interface Feature {
  name: string
  title: string
  link: string
  description: string
  depends: string[]
  relates: string[]
  derives: string[]
  tags: string[]
  since?: string
}

export default createContentLoader('features/*.md', {
  includeSrc: true,
  transform(data) {
    const derivesMap: Record<string, string[]> = {}
    for (const md of data) {
      const name = basename(md.url, '.md')
      if (name === 'index' || name === 'features')
        continue
      for (const depend of md.frontmatter.depends ?? []) {
        const dependName = depend.match(/\/([\w-]+)($|#)/)?.[1]
        if (dependName) {
          derivesMap[dependName] ??= []
          derivesMap[dependName].push(`features/${name}`)
        }
      }
    }

    const result: Record<string, Feature> = {}
    for (const md of data) {
      const name = basename(md.url, '.md')
      if (name === 'index' || name === 'features')
        continue
      const title = md.src?.match(/^# (.*)$/m)?.[1]?.trim() ?? name
      const derives = md.frontmatter.derives ?? []
      for (const d of derivesMap[name] ?? []) {
        if (!derives.includes(d)) {
          derives.push(d)
        }
      }
      result[name] = {
        name,
        title,
        link: `/features/${name}.html`,
        description: md.frontmatter.description ?? '',
        depends: md.frontmatter.depends ?? [],
        relates: md.frontmatter.relates ?? [],
        derives,
        tags: md.frontmatter.tags ?? [],
        since: md.frontmatter.since,
      }
    }
    return result
  },
})

export declare const data: Record<string, Feature>
