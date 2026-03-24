import type { Ref } from 'vue'
import { ref, shallowRef, watch } from 'vue'
import { virtualBgBlurRadius, virtualBgColor, virtualBgImage, virtualBgMode } from '../state'

let segmenterInstance: any = null
let segmenterInitPromise: Promise<any> | null = null

/**
 * Lazily initialize the MediaPipe ImageSegmenter for selfie segmentation.
 * Downloads WASM + model on first call. Deduplicates concurrent calls.
 */
async function getSegmenter() {
  if (segmenterInstance)
    return segmenterInstance

  // Deduplicate: if already loading, wait for that same promise
  if (segmenterInitPromise)
    return segmenterInitPromise

  segmenterInitPromise = (async () => {
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )

    segmenterInstance = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    })

    return segmenterInstance
  })()

  return segmenterInitPromise
}

/**
 * Preload the segmenter in the background.
 * Call this as early as possible (e.g. when camera activates)
 * so the WASM + model download happens before the user needs it.
 */
export function preloadSegmenter() {
  getSegmenter().catch(() => {
    // Preload failure is non-fatal; will retry on actual use
  })
}

/**
 * Create a composable that intercepts a raw camera MediaStream,
 * runs person segmentation, and outputs a processed stream with
 * a virtual background applied.
 */
export function useVirtualBackground(rawStream: Ref<MediaStream | undefined>) {
  const processedStream: Ref<MediaStream | undefined> = shallowRef()
  const isProcessing = ref(false)
  const isLoading = ref(false)

  let animFrameId = 0
  let hiddenVideo: HTMLVideoElement | null = null
  let canvas: HTMLCanvasElement | null = null
  let ctx: CanvasRenderingContext2D | null = null
  let bgCanvas: HTMLCanvasElement | null = null
  let bgCtx: CanvasRenderingContext2D | null = null
  let bgImage: HTMLImageElement | null = null

  // Load background image when URL/path changes
  watch(virtualBgImage, (url: string) => {
    if (url) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = url
      img.onload = () => {
        bgImage = img
      }
      img.onerror = () => {
        bgImage = null
      }
    }
    else {
      bgImage = null
    }
  }, { immediate: true })

  /**
   * Draw the background layer onto bgCanvas based on current mode.
   */
  function drawBackground(sourceVideo: HTMLVideoElement, w: number, h: number) {
    if (!bgCtx)
      return

    bgCtx.save()
    const mode = virtualBgMode.value

    if (mode === 'blur') {
      bgCtx.filter = `blur(${virtualBgBlurRadius.value}px)`
      bgCtx.drawImage(sourceVideo, 0, 0, w, h)
    }
    else if (mode === 'color') {
      bgCtx.filter = 'none'
      bgCtx.fillStyle = virtualBgColor.value
      bgCtx.fillRect(0, 0, w, h)
    }
    else if (mode === 'image' && bgImage) {
      bgCtx.filter = 'none'
      // Cover-fill the image
      const imgAspect = bgImage.width / bgImage.height
      const canvasAspect = w / h
      let sx = 0
      let sy = 0
      let sw = bgImage.width
      let sh = bgImage.height
      if (imgAspect > canvasAspect) {
        sw = bgImage.height * canvasAspect
        sx = (bgImage.width - sw) / 2
      }
      else {
        sh = bgImage.width / canvasAspect
        sy = (bgImage.height - sh) / 2
      }
      bgCtx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h)
    }
    else {
      // Fallback: solid color
      bgCtx.filter = 'none'
      bgCtx.fillStyle = virtualBgColor.value
      bgCtx.fillRect(0, 0, w, h)
    }

    bgCtx.restore()
  }

  /**
   * Per-frame render: composite foreground (person) over background using the
   * segmentation confidence mask.
   */
  function renderFrame(
    sourceVideo: HTMLVideoElement,
    mask: Float32Array | Uint8Array,
    w: number,
    h: number,
  ) {
    if (!ctx || !bgCtx)
      return

    // 1. Draw background
    drawBackground(sourceVideo, w, h)

    // 2. Draw the source frame on the main canvas
    ctx.save()
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(sourceVideo, 0, 0, w, h)

    // 3. Blend person and background using mask
    const frame = ctx.getImageData(0, 0, w, h)
    const bgFrame = bgCtx.getImageData(0, 0, w, h)
    const data = frame.data
    const bgData = bgFrame.data

    for (let i = 0; i < mask.length; i++) {
      const alpha = mask[i]
      const idx = i * 4
      data[idx] = data[idx] * alpha + bgData[idx] * (1 - alpha)
      data[idx + 1] = data[idx + 1] * alpha + bgData[idx + 1] * (1 - alpha)
      data[idx + 2] = data[idx + 2] * alpha + bgData[idx + 2] * (1 - alpha)
      data[idx + 3] = 255
    }

    ctx.putImageData(frame, 0, 0)
    ctx.restore()
  }

  async function startProcessing() {
    if (isProcessing.value || !rawStream.value)
      return

    isLoading.value = true

    try {
      const segmenter = await getSegmenter()

      // Create hidden video element to read frames from raw stream
      hiddenVideo = document.createElement('video')
      hiddenVideo.srcObject = rawStream.value
      hiddenVideo.muted = true
      hiddenVideo.playsInline = true
      await hiddenVideo.play()

      const w = hiddenVideo.videoWidth || 640
      const h = hiddenVideo.videoHeight || 480

      // Create canvases
      canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      ctx = canvas.getContext('2d', { willReadFrequently: true })!

      bgCanvas = document.createElement('canvas')
      bgCanvas.width = w
      bgCanvas.height = h
      bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true })!

      // Output stream from canvas
      processedStream.value = canvas.captureStream(30)

      // Copy audio tracks from original stream
      rawStream.value.getAudioTracks().forEach((track: MediaStreamTrack) => {
        processedStream.value!.addTrack(track)
      })

      isProcessing.value = true
      isLoading.value = false

      let lastTime = -1

      function loop() {
        if (!isProcessing.value || !hiddenVideo || hiddenVideo.paused || hiddenVideo.ended) {
          return
        }

        const now = performance.now()
        if (now !== lastTime) {
          lastTime = now
          try {
            segmenter.segmentForVideo(hiddenVideo, now, (result: any) => {
              if (result.confidenceMasks && result.confidenceMasks.length > 0) {
                const mask = result.confidenceMasks[0].getAsFloat32Array()
                renderFrame(hiddenVideo!, mask, canvas!.width, canvas!.height)
              }
              result.close?.()
            })
          }
          catch {
            // Segmentation can fail on some frames, just skip
          }
        }

        animFrameId = requestAnimationFrame(loop)
      }

      animFrameId = requestAnimationFrame(loop)
    }
    catch (err) {
      console.error('[Slidev] Failed to start virtual background:', err)
      isLoading.value = false
      processedStream.value = rawStream.value
    }
  }

  function stopProcessing() {
    isProcessing.value = false
    isLoading.value = false

    if (animFrameId) {
      cancelAnimationFrame(animFrameId)
      animFrameId = 0
    }

    if (hiddenVideo) {
      hiddenVideo.pause()
      hiddenVideo.srcObject = null
      hiddenVideo = null
    }

    processedStream.value = undefined
    canvas = null
    ctx = null
    bgCanvas = null
    bgCtx = null
  }

  // Watch for mode changes: start or stop processing
  watch(virtualBgMode, async (mode: string) => {
    if (mode === 'none') {
      stopProcessing()
    }
    else if (rawStream.value) {
      stopProcessing()
      await startProcessing()
    }
  })

  // Watch for raw stream changes
  watch(rawStream, async (stream: MediaStream | undefined) => {
    if (!stream) {
      stopProcessing()
      return
    }
    // Preload the model as soon as camera activates, so it's ready
    // when the user selects a virtual background mode
    preloadSegmenter()

    if (virtualBgMode.value !== 'none') {
      stopProcessing()
      await startProcessing()
    }
  })

  return {
    processedStream,
    isProcessing,
    isLoading,
    startProcessing,
    stopProcessing,
  }
}
