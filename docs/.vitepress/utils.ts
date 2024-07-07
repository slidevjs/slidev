import { data as features } from '../features/index.data.js'
import guides from './guides.js'

function removeHash(link: string) {
  const idx = link.lastIndexOf('#')
  return idx < 0 ? link : link.slice(0, idx)
}

function getGuideTitle(id: string) {
  return guides.find(g => g.link.endsWith(id))?.text ?? id
}

export function resolveLink(link: string): {
  kind: 'external' | 'feature' | 'guide'
  url: string
  title?: string
  descripton?: string
} {
  const [kind, nameWithHash] = link.split('/')
  const name = removeHash(nameWithHash)
  switch (kind) {
    case 'http:':
    case 'https:':
    case 'mailto:':
      return { kind: 'external', url: link }
    case 'feature': {
      const feature = features[name]
      if (!feature)
        throw new Error(`Feature "${name}" not found.`)
      return {
        kind: 'feature',
        title: `✨ ${feature.title}`,
        descripton: feature.description,
        url: `/features/${nameWithHash}`,
      }
    }
    case 'guide': {
      return {
        kind: 'guide',
        title: `📘 ${getGuideTitle(name)}`,
        url: `/guide/${nameWithHash}`,
      }
    }
    default:
      throw new Error(`Invalid link: ${link}`)
  }
}
