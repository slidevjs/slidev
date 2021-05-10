/* eslint-disable @typescript-eslint/no-var-requires */
import { join } from 'path'
import fs from 'fs-extra'
import { objectMap } from '@antfu/utils'
import { $ } from 'zx'

await $`npx bumpp package.json packages/*/package.json`

const templates = [
  'packages/create-app/template',
  'packages/create-theme/template',
]

const { version } = await import('../package.json')

for (const template of templates) {
  const path = join(template, 'package.json')
  const pkg = await fs.readJSON(path)
  pkg.dependencies = objectMap(pkg.dependencies, (k, v) => {
    if (k.startsWith('@slidev/'))
      return [k, `^${version}`]
    return [k, v]
  })
  await fs.writeJSON(path, pkg, { spaces: 2 })
}

await $`git add .`
await $`git commit -m "chore: release v${version}"`
await $`git tag v${version}`
await $`git push`
await $`git push origin --tags`
