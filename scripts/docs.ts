import path from 'path'
import execa from 'execa'

function run(command: string, cwd?: string) {
  execa.commandSync(command, { stdio: 'inherit', cwd })
}

run('npm run build')

run('cp packages/create-app/template/slides.md demo/build.md')
run('cp -R packages/create-app/template/public demo')

run('npx slidev build build.md --base /demo/', path.resolve(__dirname, '../demo'))

run('cp -R demo/dist docs/public/demo')

run('npx vitepress build docs')
