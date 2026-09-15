import type { Options } from 'tinyexec'
import fs from 'node:fs/promises'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'
import { x } from 'tinyexec'

async function retry(label: string, fn: () => Promise<unknown>, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      await fn()
      return
    }
    catch (error) {
      if (attempt >= attempts)
        throw error
      const delay = attempt * 15_000
      console.warn(`\n${label} failed (attempt ${attempt}/${attempts}), retrying in ${delay / 1000}s...\n`, error)
      await sleep(delay)
    }
  }
}

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

  const options: Partial<Options> = {
    nodeOptions: {
      cwd: root,
      stdio: 'inherit',
    },
    throwOnError: true,
  }

  await x('npm', ['run', 'build'], options)
  console.log('\nPublish to VSCE...\n')
  await retry('Publish to VSCE', () => x('npx', ['@vscode/vsce', 'publish', '--no-dependencies', '--skip-duplicate', '-p', process.env.VSCE_TOKEN!], options))
  console.log('\nPublish to OVSE...\n')
  await retry('Publish to OVSX', () => x('npx', ['ovsx', 'publish', '--no-dependencies', '--skip-duplicate', '-p', process.env.OVSX_TOKEN!], options))
}

publish()
