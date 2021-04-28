import path from 'path'
import { invoke } from '@antfu/utils'
import { installBrowsersWithProgressBar } from 'playwright-chromium/lib/install/installer'
import { run } from './run'

invoke(async() => {
  await installBrowsersWithProgressBar()

  run('mkdir docs/public/demo')

  run('npm run build')

  run('npx slidev build slides.md -d --base /demo/composable-vue/', path.resolve(__dirname, '../demo'))
  run('cp -R demo/dist docs/public/demo/composable-vue')

  run('cp packages/create-app/template/slides.md demo/build.md')
  run('cp -R packages/create-app/template/public demo')
  run('npx slidev build build.md -d --base /demo/starter/', path.resolve(__dirname, '../demo'))

  run('cp -R demo/dist docs/public/demo/starter')

  run('npx vitepress build docs')
})
