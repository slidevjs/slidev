const TWEET_HOSTS = new Set([
  'mobile.twitter.com',
  'mobile.x.com',
  'twitter.com',
  'www.twitter.com',
  'www.x.com',
  'x.com',
])

export function resolveTweetId(
  id: string | number | undefined,
  sourceUrl: string | undefined,
): string | undefined {
  if (typeof id === 'number')
    return id.toString()

  if (id?.trim())
    return id.trim()

  if (!sourceUrl)
    return

  try {
    const url = new URL(sourceUrl)
    if (!['http:', 'https:'].includes(url.protocol) || !TWEET_HOSTS.has(url.hostname))
      return

    const segments = url.pathname.split('/').filter(Boolean)
    const statusIndex = segments.lastIndexOf('status')
    const tweetId = segments[statusIndex + 1]
    if (statusIndex < 1 || !tweetId || !/^\d+$/.test(tweetId))
      return

    return tweetId
  }
  catch {}
}
