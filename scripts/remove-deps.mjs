import { resolve } from 'node:path'
import * as fs from 'node:fs/promises'

const path = resolve('./package.json')

async function removeDeps() {
  const pkgJson = JSON.parse(await fs.readFile(path, 'utf-8'))
  let count = 0
  for(const key in pkgJson.dependencies) {
    if(key.startsWith('@slidev')) {
      delete pkgJson.dependencies[key]
      count++
    }
  }
  for(const key in pkgJson.devDependencies) {
    if(key.startsWith('@slidev')) {
      delete pkgJson.devDependencies[key]
      count++
    }
  }
  await fs.writeFile(path, JSON.stringify(pkgJson, null, 2))
  return count
}

console.log(`removed ${await removeDeps()} dependencies from ${path}`)
