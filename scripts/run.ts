import execa from 'execa'

export function run(command: string) {
  execa.commandSync(command, { stdio: 'inherit' })
}
