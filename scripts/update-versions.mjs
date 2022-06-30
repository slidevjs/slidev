import { join } from 'path'
import { objectMap } from '@antfu/utils'
import { fs } from 'zx'

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
