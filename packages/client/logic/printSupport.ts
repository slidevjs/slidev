/**
 * Printing in WebKit browsers (Safari, and every browser on iOS) doesn't reliably
 * honor the `@page` size and margins Slidev sets, and their print dialog doesn't
 * offer the margin options our tips refer to, so the exported PDF may not match
 * the slides. See https://github.com/slidevjs/slidev/issues/2013
 */
export function isPdfExportSupported(userAgent: string) {
  const isWebKit = /AppleWebKit\//.test(userAgent) && !/Chrom(?:e|ium)\//.test(userAgent)
  return !isWebKit
}
