import type { ResolvedSlidevOptions } from '@slidev/types'
import type { VirtualModuleContext } from '../packages/slidev/node/virtual/types'
import { describe, expect, it } from 'vitest'
import { templateSetups } from '../packages/slidev/node/virtual/setups'

describe('mermaid-renderer virtual module', () => {
  it('registers /@slidev/setups/mermaid-renderer', () => {
    const ids = templateSetups.map(t => t.id)
    expect(ids).toContain('/@slidev/setups/mermaid-renderer')
  })

  it('generates content with mermaid-renderer glob', () => {
    const template = templateSetups.find(t => t.id === '/@slidev/setups/mermaid-renderer')!
    const context: VirtualModuleContext = {
      makeAbsoluteImportGlob: () => '/node_modules/.slidev/virtual/setups/mermaid-renderer.test.ts',
      resolve: async () => null,
    }
    const content = template.getContent.call(context, {
      userRoot: '/user/project',
      roots: ['/user/project'],
    } as ResolvedSlidevOptions)

    expect(content).toContain('mermaid-renderer')
    expect(content).toContain('import __slidev_setup_0 from "/node_modules/.slidev/virtual/setups/mermaid-renderer.test.ts"')
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
