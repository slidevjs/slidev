import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { getPackageRoot } from './env'

export async function getIndexHtml(): Promise<string> {
  const packageRoot = getPackageRoot()
  const mainEntry = resolve(packageRoot, 'client/main.ts')
  return (await fs.readFile(join(packageRoot, 'client/index.html'), 'utf-8')).replace('__ENTRY__', `/@fs${mainEntry}`)
}
