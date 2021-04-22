/* eslint-disable @typescript-eslint/no-var-requires */
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

function run(command: string) {
  execSync(command, { stdio: 'inherit' })
}

run('npx bumpp package.json packages/*/package.json --preid alpha')
const version = require('../package.json').version

const pkg = JSON.parse(readFileSync('packages/create-app/template/package.json', 'utf-8'))
pkg.dependencies['@slidev/theme-default'] = `^${version}`
pkg.dependencies.slidev = `^${version}`
writeFileSync('packages/create-app/template/package.json', `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')

run('git add .')
run(`git commit -m "chore: release v${version}"`)
run(`git tag "v${version}"`)
run('git push --follow-tags')
run('pnpm -r publish --access public')
