/* eslint-disable no-console */
import process from 'node:process'
import fs from 'fs-extra'
import { execa } from 'execa'

async function publish() {
  const root = new URL('..', import.meta.url)
  const rawJSON = await fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')
  const pkg = JSON.parse(rawJSON)

  if (pkg.version.includes('-')) {
    console.warn('Skipping publish VS Code extension because the version contains a pre-release tag.')
    return
  }

  console.log('Publishing VS Code extension...')

  await execa('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
  console.log('\nPublish to VSCE...\n')
  await execa('npx', ['@vscode/vsce', 'publish', '--no-dependencies', '-p', process.env.VSCE_TOKEN!], { cwd: root, stdio: 'inherit' })
  console.log('\nPublish to OVSE...\n')
  await execa('npx', ['ovsx', 'publish', '--no-dependencies', '-p', process.env.OVSX_TOKEN!], { cwd: root, stdio: 'inherit' })
}

publish()
