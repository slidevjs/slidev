export async function startScreenshotSession(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const video = document.createElement('video')
  video.width = width
  video.height = height

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
  captureStream.addEventListener('inactive', dispose)

  video.srcObject = captureStream
  video.play()

  function screenshot(element: HTMLElement) {
    if (!captureStream)
      throw new Error('captureStream inactive')
    context.clearRect(0, 0, width, height)
    const { left, top, width: elWidth } = element.getBoundingClientRect()
    context.drawImage(
      video,
      left * window.devicePixelRatio,
      top * window.devicePixelRatio,
      elWidth * window.devicePixelRatio,
      elWidth / width * height * window.devicePixelRatio,
      0,
      0,
      width,
      height,
    )
    return canvas.toDataURL('image/png')
  }

  function dispose() {
    captureStream?.getTracks().forEach(track => track.stop())
    captureStream = null
  }

  return {
    screenshot,
    dispose,
  }
}

export type ScreenshotSession = Awaited<ReturnType<typeof startScreenshotSession>>
