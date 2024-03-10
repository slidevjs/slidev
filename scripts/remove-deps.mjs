import { fs } from 'zx'

async function removeDeps() {
  const pkgJson = JSON.parse(await fs.readFile(`./package.json`, 'utf-8'))
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
  await fs.writeFile(`${path}/package.json`, JSON.stringify(pkgJson, null, 2))
  return count
}

console.log(`removed ${await removeDeps()} dependencies from ${path}`)
