import execa from 'execa'

export function run(command: string, cwd?: string) {
  execa.commandSync(command, { stdio: 'inherit', cwd })
}
