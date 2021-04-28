import path from 'path'
import execa from 'execa'

function run(command: string, cwd?: string) {
  execa.commandSync(command, { stdio: 'inherit', cwd })
}

run('mkdir docs/public/demo')

run('npm run build')

run('npx slidev build slides.md --base /demo/composable-vue/', path.resolve(__dirname, '../demo'))
run('cp -R demo/dist docs/public/demo/composable-vue')

run('cp packages/create-app/template/slides.md demo/build.md')
run('cp -R packages/create-app/template/public demo')
run('npx slidev build build.md --base /demo/starter/', path.resolve(__dirname, '../demo'))

run('cp -R demo/dist docs/public/demo/starter')

run('npx vitepress build docs')
