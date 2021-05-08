/* eslint-disable @typescript-eslint/no-var-requires */
import { join } from 'path'
import fs from 'fs-extra'
import { objectMap } from '@antfu/utils'
import { run, runArgs } from './run'

;(async() => {
  await run('npx bumpp package.json packages/*/package.json')

  const templates = [
    'packages/create-app/template',
    'packages/create-theme/template',
  ]

  const { version } = require('../package.json')

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

  await run('git add .')
  await runArgs('git', ['commit', '-m', `chore: release v${version}`])
  await run(`git tag v${version}`)
  await run('git push')
  await run('git push origin --tags')
})()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
