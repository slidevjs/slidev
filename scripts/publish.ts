import fs from 'fs-extra'
import { run } from './run'

fs.copyFileSync('README.md', 'packages/slidev/README.md')

run('npx pnpm -r publish --access public --no-git-checks')
