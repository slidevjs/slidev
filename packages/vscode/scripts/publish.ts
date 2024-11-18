import process from 'node:process'
import fs from 'fs-extra'
import { x } from 'tinyexec'

async function publish() {
  const root = new URL('..', import.meta.url)
  const rawJSON = await fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')
  const pkg = JSON.parse(rawJSON)

  if (pkg.version.includes('-')) {
    console.warn('Skipping publish VS Code extension because the version contains a pre-release tag.')
    return
  }

  if (!process.env.VSCE_TOKEN) {
    console.error('Missing VSCE_TOKEN')
    process.exit(1)
  }
  if (!process.env.OVSX_TOKEN) {
    console.error('Missing OVSX_TOKEN')
    process.exit(1)
  }

  console.log('Publishing VS Code extension...')

  await x('npm', ['run', 'build'], { nodeOptions: { cwd: root, stdio: 'inherit' } })
  console.log('\nPublish to VSCE...\n')
  await x('npx', ['@vscode/vsce', 'publish', '--no-dependencies', '-p', process.env.VSCE_TOKEN!], { nodeOptions: { cwd: root, stdio: 'inherit' } })
  console.log('\nPublish to OVSE...\n')
  await x('npx', ['ovsx', 'publish', '--no-dependencies', '-p', process.env.OVSX_TOKEN!], { nodeOptions: { cwd: root, stdio: 'inherit' } })
}

publish()
