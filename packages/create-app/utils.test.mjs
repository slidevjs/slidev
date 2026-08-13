import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getManualPackageManager, renderReadme } from './utils.mjs'

const readmeTemplate = fs.readFileSync(
  fileURLToPath(new URL('./template/README.md', import.meta.url)),
  'utf8',
)

describe('create-slidev manual setup', () => {
  it('uses npm when direct-node execution detects no package manager', () => {
    const packageManager = getManualPackageManager(null)

    expect(packageManager).toBe('npm')
    expect(renderReadme(readmeTemplate, packageManager)).toBe(readmeTemplate)
    expect(`${packageManager} install`).toBe('npm install')
    expect(`${packageManager} run dev`).toBe('npm run dev')
  })
})
