/* eslint-disable @typescript-eslint/no-var-requires */
import { join } from 'path'
import { execSync } from 'child_process'
import fs from 'fs-extra'
import { objectMap } from '@antfu/utils'
import { $ } from 'zx'

execSync('npx bumpp package.json packages/*/package.json', { stdio: 'inherit' })

const templates = [
  'packages/create-app/template',
  'packages/create-theme/template',
]

const { version } = await fs.readJSON('package.json')

for (const template of templates) {
  const path = join(template, 'package.json')
  const pkg = await fs.readJSON(path)
  const deps = ['dependencies', 'devDependencies']
  for (const name of deps) {
    if (!pkg[name])
      continue
    pkg[name] = objectMap(pkg[name], (k, v) => {
      if (k.startsWith('@slidev/') && !k.startsWith('@slidev/theme'))
        return [k, `^${version}`]
      return [k, v]
    })
  }
  await fs.writeJSON(path, pkg, { spaces: 2 })
}

await $`git add .`
await $`git commit -m "chore: release v${version}"`
await $`git tag v${version}`
await $`git push`
await $`git push origin --tags`
