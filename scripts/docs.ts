import path from 'path'
import { installBrowsersWithProgressBar } from 'playwright-chromium/lib/install/installer'
import { run } from './run'

;(async() => {
  await installBrowsersWithProgressBar()

  run('npm run build')
  run('npx vitepress build', path.resolve(__dirname, '../docs'))

  run('npx slidev build slides.md -d --base /demo/composable-vue/ --out ../docs/.vitepress/dist/demo/composable-vue', path.resolve(__dirname, '../demo'))

  run('cp packages/create-app/template/slides.md demo/build.md')
  run('cp -R packages/create-app/template/public demo')
  run('npx slidev build build.md -d --base /demo/starter/ --out ../docs/.vitepress/dist/demo/starter', path.resolve(__dirname, '../demo'))
})()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
