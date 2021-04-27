import { execSync } from 'child_process'
import path from 'path'

function run(command: string, cwd?: string) {
  execSync(command, { stdio: 'inherit', cwd })
}

run('npx vitepress build docs')

run('npm run build')

run('cp packages/create-app/template/slides.md demo/build.md')

run('npx slidev build build.md --base /demo/', path.resolve(__dirname, '../demo'))

run('cp -R demo/dist docs/.vitepress/dist/demo')
