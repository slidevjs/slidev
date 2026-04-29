import { mkdir, rm } from 'node:fs/promises'

export async function preparePngExportDirectory(writeToDisk: string | false, clean = true) {
  if (!writeToDisk)
    return

  if (clean)
    await rm(writeToDisk, { force: true, recursive: true })
  await mkdir(writeToDisk, { recursive: true })
}
