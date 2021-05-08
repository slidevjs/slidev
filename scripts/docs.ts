import path from 'path'
import { installBrowsersWithProgressBar } from 'playwright-chromium/lib/install/installer'
import { run } from './run'

;(async() => {
  await installBrowsersWithProgressBar()

  await run('npm run build')
  await run('npx vitepress build', path.resolve(__dirname, '../docs'))

  await run('npx slidev build -d --base /demo/composable-vue/ --out ../../docs/.vitepress/dist/demo/composable-vue', path.resolve(__dirname, '../demo/composable-vue'))
  await run('npx slidev build -d --base /demo/starter/ --out ../../docs/.vitepress/dist/demo/starter', path.resolve(__dirname, '../demo/starter'))
})()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
