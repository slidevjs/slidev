import { resolve } from 'node:path'
import process from 'node:process'
import { $, argv, cd, fs } from 'zx'

const WORKSPACE_ROOT = process.cwd()
const PKG_ROOT = resolve(WORKSPACE_ROOT, argv._[0])

const packages = {
  'types': './packages/types',
  'parser': './packages/parser',
  'cli': './packages/slidev',
  'client': './packages/client',
  'create-app': './packages/create-app',
}

async function replaceDeps() {
  cd(WORKSPACE_ROOT)
  for (const path of Object.values(packages)) {
    console.log('[pack] replaceDeps', path)
    const pkgJson = JSON.parse(await fs.readFile(`${path}/package.json`, 'utf-8'))
    for (const name in packages) {
      const pkg = `@slidev/${name}`
      if (pkgJson.dependencies?.[pkg])
        pkgJson.dependencies[pkg] = `file:${PKG_ROOT}/${name}.tgz`
      if (pkgJson.devDependencies?.[pkg])
        pkgJson.devDependencies[pkg] = `file:${PKG_ROOT}/${name}.tgz`
    }
    await fs.writeFile(`${path}/package.json`, JSON.stringify(pkgJson, null, 2))
  }
}

async function pack() {
  await replaceDeps()
  await fs.mkdir(PKG_ROOT, { recursive: true })
  for (const [name, path] of Object.entries(packages)) {
    console.log('[pack] pack', path)
    cd(resolve(WORKSPACE_ROOT, path))
    const { stdout } = await $`pnpm pack`
    await fs.move(stdout.trim(), `${PKG_ROOT}/${name}.tgz`)
  }
}

console.log('[pack] start packing...')
await pack()
console.log('[pack] done')
