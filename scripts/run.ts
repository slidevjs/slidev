import { execSync } from 'child_process'

export function run(command: string) {
  execSync(command, { stdio: 'inherit' })
}
