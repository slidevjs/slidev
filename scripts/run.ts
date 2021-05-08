import execa from 'execa'

export function run(command: string, cwd?: string) {
  return execa.command(command, { stdio: 'inherit', cwd })
}

export function runArgs(command: string, args: string[], cwd?: string) {
  return execa(command, args, { stdio: 'inherit', cwd })
}
