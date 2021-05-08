import fs from 'fs-extra'
import { run } from './run'

;(async() => {
  await fs.copyFile('README.md', 'packages/slidev/README.md')
  await run('npx pnpm -r publish --access public --no-git-checks')
})()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
