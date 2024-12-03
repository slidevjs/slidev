export async function startScreenshotSession<Extras>(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const video = document.createElement('video')
  canvas.width = width
  canvas.height = height
  const results: ScreenshotResult<Extras> = []

  let captureStream: MediaStream | null = await navigator.mediaDevices.getDisplayMedia({
    video: {
      // Use a rather small frame rate
      frameRate: 10,
      // @ts-expect-error missing types
      cursor: 'never',
    },
    selfBrowserSurface: 'include',
    preferCurrentTab: true,
  })
  captureStream.addEventListener('inactive', finish)

  video.srcObject = captureStream
  video.play()

  function screenshot(element: HTMLElement, extras: Extras) {
    if (!captureStream)
      throw new Error('captureStream inactive')
    context.clearRect(0, 0, width, height)
    const { left, top, width: elWidth } = element.getBoundingClientRect()
    const sourceWidth = elWidth * window.devicePixelRatio
    const sourceHeight = height / width * sourceWidth
    context.drawImage(video, left + 1, top + 1, sourceWidth, sourceHeight, 0, 0, width, height)
    setTimeout(() => results.push({ ...extras, dataUrl: canvas.toDataURL('image/png') }), 50)
  }

  function finish() {
    captureStream?.getTracks().forEach(track => track.stop())
    captureStream = null
    return results
  }

  return {
    screenshot,
    finish,
  }
}

export type ScreenshotSession<Extras> = Awaited<ReturnType<typeof startScreenshotSession<Extras>>>
export type ScreenshotResult<Extras> = (Extras & { dataUrl: string })[]
