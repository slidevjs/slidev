import { extname, resolve, join } from 'path'
import { existsSync, mkdirSync, createWriteStream } from 'fs'
import http from 'http'
import https from 'https'
import { Plugin } from 'vite'
import md5 from 'blueimp-md5'

function isValidHttpUrl(str: string) {
  let url
  try {
    url = new URL(str)
  }
  catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

export function cacheRemoteAssets(): Plugin {
  const folder = '.cache-remote'
  const root = resolve('public', folder)

  if (!existsSync(root))
    mkdirSync(root)

  async function downloadTo(url: string, filepath: string): Promise<void> {
    const file = createWriteStream(filepath)
    const client = url.startsWith('https') ? https : http
    const request = client.get(url, res => res.pipe(file))

    return new Promise((resolve, reject) => {
      request.on('finish', resolve)
      request.on('error', reject)
    })
  }

  return {
    name: 'vite-plugin-cache-remote',
    enforce: 'pre',
    async transform(code) {
      const tasks: Promise<void>[] = []
      code = code.replace(
        /\b(https?:\/\/[\w_#&?.\/-]*?\.(?:png|jpe?g|svg|ico))([`'")\]])/ig,
        (_, url, end) => {
          if (!isValidHttpUrl(url))
            return _
          const hash = md5(url) + extname(url)
          const filepath = join(root, hash)

          if (!existsSync(filepath)) {
            tasks.push(downloadTo(url, filepath))
            console.log(`caching ${url}`)
          }

          return `/${folder}/${hash}${end}`
        },
      )

      await Promise.all(tasks)

      return code
    },
  }
}
