import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Rolldown } from 'vite'
import { describe, expect, it } from 'vitest'
import { templateSetups } from '../packages/slidev/node/virtual/setups'

describe('mermaid-renderer virtual module', () => {
  it('registers /@slidev/setups/mermaid-renderer', () => {
    const ids = templateSetups.map(t => t.id)
    expect(ids).toContain('/@slidev/setups/mermaid-renderer')
  })

  it('generates content with mermaid-renderer glob', () => {
    const template = templateSetups.find(t => t.id === '/@slidev/setups/mermaid-renderer')!
    const content = template.getContent.call({} as Rolldown.PluginContext, {
      userRoot: '/user/project',
      roots: ['/user/project'],
    } as ResolvedSlidevOptions)

    expect(content).toContain('mermaid-renderer')
    expect(content).toContain('export default')
    expect(content).toContain('filter(Boolean)')
  })

  it('comes after mermaid in templateSetups', () => {
    const ids = templateSetups.map(t => t.id)
    const mermaidIdx = ids.indexOf('/@slidev/setups/mermaid')
    const rendererIdx = ids.indexOf('/@slidev/setups/mermaid-renderer')
    expect(mermaidIdx).toBeGreaterThanOrEqual(0)
    expect(rendererIdx).toBeGreaterThan(mermaidIdx)
  })
})
