import * as fs from 'node:fs/promises'
import { resolve } from 'node:path'

const path = resolve('./package.json')

const OVERRIDDEN_PKGS = [
  '@slidev/cli',
  '@slidev/types',
  '@slidev/parser',
  '@slidev/client',
]

async function removeDeps() {
  const pkgJson = JSON.parse(await fs.readFile(path, 'utf-8'))
  let count = 0
  for (const key in pkgJson.dependencies) {
    if (OVERRIDDEN_PKGS.includes(key)) {
      delete pkgJson.dependencies[key]
      count++
    }
  }
  for (const key in pkgJson.devDependencies) {
    if (OVERRIDDEN_PKGS.includes(key)) {
      delete pkgJson.devDependencies[key]
      count++
    }
  }
  await fs.writeFile(path, JSON.stringify(pkgJson, null, 2))
  return count
}

console.log(`Removed ${await removeDeps()} dependencies from ${path}`)
