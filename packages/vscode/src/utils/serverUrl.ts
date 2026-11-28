function normalizeHost(host: string) {
  host = host.trim() || 'localhost'
  // IPv6 addresses need to be wrapped in brackets in URLs
  if (host.includes(':') && !host.startsWith('['))
    return `[${host}]`
  return host
}

export function getServerUrl(host: string, port: number) {
  return `http://${normalizeHost(host)}:${port}`
}

export function getDetectUrls(host: string, port: number) {
  host = normalizeHost(host)
  // We can't use `localhost:` here, so try both loopback addresses
  if (host.toLowerCase() === 'localhost')
    return [`http://[::1]:${port}`, `http://127.0.0.1:${port}`]
  return [`http://${host}:${port}`]
}
