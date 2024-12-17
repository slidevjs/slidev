import { computed, ref } from 'vue'

export async function startScreenshotSession(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const video = document.createElement('video')
  video.width = width
  video.height = height

  const captureStream = ref<MediaStream | null>(await navigator.mediaDevices.getDisplayMedia({
    video: {
      // Use a rather small frame rate
      frameRate: 10,
      // @ts-expect-error missing types
      cursor: 'never',
    },
    selfBrowserSurface: 'include',
    preferCurrentTab: true,
  }))
  captureStream.value!.addEventListener('inactive', dispose)

  video.srcObject = captureStream.value!
  video.play()

  function screenshot(element: HTMLElement) {
    if (!captureStream.value)
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
    captureStream.value?.getTracks().forEach(track => track.stop())
    captureStream.value = null
  }

  return {
    isActive: computed(() => !!captureStream.value),
    screenshot,
    dispose,
  }
}

export type ScreenshotSession = Awaited<ReturnType<typeof startScreenshotSession>>

const chromeVersion = window.navigator.userAgent.match(/Chrome\/(\d+)/)?.[1]
export const isScreenshotSupported = chromeVersion ? Number(chromeVersion) >= 94 : false
