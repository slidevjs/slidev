import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { objectMap } from '@antfu/utils'
import { version } from '../package.json'
import { run, runArgs } from './run'

run('npx bumpp package.json packages/*/package.json --preid alpha')

const templates = [
  'packages/create-app/template',
  'packages/create-theme/template',
]

for (const template of templates) {
  const path = join(template, 'package.json')
  const pkg = JSON.parse(readFileSync(path, 'utf-8'))
  pkg.dependencies = objectMap(pkg.dependencies, (k, v) => {
    if (k.startsWith('@slidev/'))
      return [k, `^${version}`]
    return [k, v]
  })
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
}

run('git add .')
runArgs('git', ['commit', '-m', `chore: release v${version}`])
run(`git tag "v${version}"`)
run('git push')
run('git push origin --tags')
