import { fileURLToPath } from 'node:url'
import { guardStaleBuild } from 'tsdown-stale-guard'
import { describePackagesApiSnapshots } from 'tsnapi/vitest'

await describePackagesApiSnapshots({
  packages: [
    fileURLToPath(new URL('../packages/types', import.meta.url)),
    fileURLToPath(new URL('../packages/parser', import.meta.url)),
  ],
  async beforeEach({ packageRoot }) {
    await guardStaleBuild({ root: packageRoot })
  },
})
