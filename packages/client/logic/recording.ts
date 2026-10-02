import type RecorderType from 'recordrtc'
import type { Options as RecorderOptions } from 'recordrtc'
import type { Ref } from 'vue'
import type { NoiseSuppressionMode } from './recording-audio'
import type { NoiseSuppressionPipeline } from './recording-noise-suppression'
import { isTruthy } from '@antfu/utils'
import { fixWebmDuration } from '@fix-webm-duration/fix'
import { useDevicesList, useEventListener, useLocalStorage } from '@vueuse/core'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { currentCamera, currentMic } from '../state'
import { getAudioConstraints, normalizeNoiseSuppressionMode, usesWorkletNoiseSuppression } from './recording-audio'
import { createNoiseSuppressionPipeline } from './recording-noise-suppression'

export { getAudioConstraints } from './recording-audio'
export type { NoiseSuppressionMode } from './recording-audio'

type Defined<T> = T extends undefined ? never : T
type MimeType = Defined<RecorderOptions['mimeType']>

export function shouldRecreateStream(stream: MediaStream | undefined, recording: boolean) {
  return !!stream && !recording
}

export const recordingName = ref('')
export const recordCamera = ref(true)
export const mimeType = useLocalStorage<MimeType>('slidev-record-mimetype', 'video/webm')
export const frameRate = useLocalStorage<number>('slidev-record-framerate', 30)
export const bitRate = useLocalStorage<number>('slidev-record-bitrate', 8192)
export const resolution = useLocalStorage<string>('slidev-record-resolution', '1920x1080')
export const echoCancellation = useLocalStorage('slidev-record-echo-cancellation', true)
const noiseSuppressionSetting = useLocalStorage<NoiseSuppressionMode | boolean>('slidev-record-noise-suppression', 'browser')
export const noiseSuppression = computed<NoiseSuppressionMode>({
  get: () => normalizeNoiseSuppressionMode(noiseSuppressionSetting.value),
  set: value => noiseSuppressionSetting.value = value,
})

export const mimeExtMap: Record<string, string> = {
  'video/webm': 'webm',
  'video/webm;codecs=h264': 'mp4',
  'video/x-matroska;codecs=avc1': 'mkv',
}

export function getFilename(media?: string, mimeType?: string) {
  const d = new Date()

  const pad = (v: number) => `${v}`.padStart(2, '0')

  const date = `${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`

  const ext = mimeType ? mimeExtMap[mimeType] : 'webm'

  return `${[media, recordingName.value, date].filter(isTruthy).join('-')}.${ext}`
}

function getSupportedMimeTypes() {
  if (MediaRecorder && typeof MediaRecorder.isTypeSupported === 'function')
    return Object.keys(mimeExtMap).filter(mime => MediaRecorder.isTypeSupported(mime))
  return []
}

export const supportedMimeTypes = getSupportedMimeTypes()

export const {
  devices,
  videoInputs: cameras,
  audioInputs: microphones,
  ensurePermissions: ensureDevicesListPermissions,
} = useDevicesList({
  onUpdated() {
    if (currentCamera.value !== 'none') {
      if (!cameras.value.some(i => i.deviceId === currentCamera.value))
        currentCamera.value = cameras.value[0]?.deviceId || 'default'
    }
    if (currentMic.value !== 'none') {
      if (!microphones.value.some(i => i.deviceId === currentMic.value))
        currentMic.value = microphones.value[0]?.deviceId || 'default'
    }
  },
})

export function download(name: string, url: string) {
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', name)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function useRecording() {
  const recording = ref(false)
  const showAvatar = ref(false)

  const recorderCamera: Ref<RecorderType | undefined> = shallowRef()
  const recorderSlides: Ref<RecorderType | undefined> = shallowRef()
  const streamCamera: Ref<MediaStream | undefined> = shallowRef()
  const streamCapture: Ref<MediaStream | undefined> = shallowRef()
  const streamSlides: Ref<MediaStream | undefined> = shallowRef()
  let noiseSuppressionPipeline: NoiseSuppressionPipeline | undefined
  let recordingStartTime = 0

  const config: RecorderOptions = {
    type: 'video',
    // Extending recording limit as default is only 1h (see https://github.com/muaz-khan/RecordRTC/issues/144)
    timeSlice: 24 * 60 * 60 * 1000,
  }

  async function toggleAvatar() {
    if (currentCamera.value === 'none')
      return

    if (showAvatar.value) {
      showAvatar.value = false
      if (!recording.value)
        closeStream(streamCamera)
    }
    else {
      await startCameraStream()
      if (streamCamera.value)
        showAvatar.value = !!streamCamera.value
    }
  }

  async function startCameraStream(noiseSuppressionMode = noiseSuppression.value) {
    await ensureDevicesListPermissions()
    await nextTick()

    // Stopped tracks can never be resumed, the whole stream has to be requested again
    if (streamCamera.value?.getTracks().some(track => track.readyState === 'ended'))
      closeStream(streamCamera)

    if (!streamCamera.value) {
      if (currentCamera.value === 'none' && currentMic.value === 'none')
        return

      streamCamera.value = await navigator.mediaDevices.getUserMedia({
        video: (currentCamera.value === 'none' || recordCamera.value !== true)
          ? false
          : {
              deviceId: currentCamera.value,
            },
        audio: currentMic.value === 'none'
          ? false
          : getAudioConstraints(currentMic.value, echoCancellation.value, noiseSuppressionMode),
      })
    }
  }

  watch(currentCamera, async (v) => {
    if (v === 'none') {
      closeStream(streamCamera)
    }
    else {
      if (recording.value)
        return
      // restart camera stream
      if (streamCamera.value) {
        closeStream(streamCamera)
        await startCameraStream()
      }
    }
  })

  async function startRecording(customConfig?: RecorderOptions) {
    await ensureDevicesListPermissions()
    const { default: Recorder } = await import('recordrtc')
    if (shouldRecreateStream(streamCamera.value, recording.value))
      closeStream(streamCamera)
    await startCameraStream()

    if (streamCamera.value && usesWorkletNoiseSuppression(noiseSuppression.value)) {
      try {
        noiseSuppressionPipeline = await createNoiseSuppressionPipeline(streamCamera.value, noiseSuppression.value)
      }
      catch (error) {
        console.warn('Failed to initialize enhanced noise suppression; using browser built-in suppression.', error)
        closeStream(streamCamera)
        await startCameraStream('browser')
      }
    }

    try {
      const [width, height] = resolution.value.split('x').map(Number)
      streamCapture.value = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // aspectRatio: 1.6,
          frameRate: frameRate.value,
          width,
          height,
          // @ts-expect-error missing types
          cursor: 'motion',
          resizeMode: 'crop-and-scale',
        },
        selfBrowserSurface: 'include',
      })
      streamCapture.value.addEventListener('inactive', stopRecording)

      // We need to create a new Stream to merge video and audio to have the inactive event working on streamCapture
      streamSlides.value = new MediaStream()
      streamCapture.value!.getVideoTracks().forEach(videoTrack => streamSlides.value!.addTrack(videoTrack))

      // merge config
      Object.assign(config, customConfig)

      const audioTrack = noiseSuppressionPipeline?.destination.stream.getAudioTracks()?.[0]
        ?? streamCamera.value?.getAudioTracks()?.[0]

      if (audioTrack)
        streamSlides.value.addTrack(audioTrack)

      if (streamCamera.value) {
        const cameraStream = new MediaStream(streamCamera.value.getVideoTracks())
        if (audioTrack)
          cameraStream.addTrack(audioTrack)

        recorderCamera.value = new Recorder(
          cameraStream,
          config,
        )
        recorderCamera.value.startRecording()
      }

      recorderSlides.value = new Recorder(
        streamSlides.value!,
        config,
      )

      recorderSlides.value.startRecording()
      recordingStartTime = Date.now()
      recording.value = true
    }
    catch (error) {
      noiseSuppressionPipeline?.close()
      noiseSuppressionPipeline = undefined
      throw error
    }
  }

  async function stopRecording() {
    recording.value = false
    const duration = Date.now() - recordingStartTime
    const cameraRecorder = recorderCamera.value
    const slidesRecorder = recorderSlides.value
    let cameraRecorderStopped = !cameraRecorder
    let slidesRecorderStopped = !slidesRecorder

    const closeNoiseSuppression = () => {
      if (!cameraRecorderStopped || !slidesRecorderStopped)
        return
      noiseSuppressionPipeline?.close()
      noiseSuppressionPipeline = undefined
    }

    cameraRecorder?.stopRecording(() => {
      if (recordCamera.value) {
        const blob = cameraRecorder.getBlob()
        downloadBlob(blob, duration, getFilename('camera', config.mimeType))
      }
      cameraRecorderStopped = true
      recorderCamera.value = undefined
      if (!showAvatar.value)
        closeStream(streamCamera)
      closeNoiseSuppression()
    })
    slidesRecorder?.stopRecording(() => {
      const blob = slidesRecorder.getBlob()
      downloadBlob(blob, duration, getFilename('screen', config.mimeType))
      closeStream(streamCapture)
      // `streamSlides` only borrows its tracks from `streamCapture` and `streamCamera`,
      // stopping them here would also end the mic still used by the camera stream
      streamSlides.value = undefined
      recorderSlides.value = undefined
      slidesRecorderStopped = true
      closeNoiseSuppression()
    })
  }

  async function downloadBlob(blob: Blob, duration: number, filename: string) {
    const fixedBlob = await fixWebmDuration(blob, duration, { logger: false })
    const url = URL.createObjectURL(fixedBlob)
    download(filename, url)
    window.URL.revokeObjectURL(url)
  }

  function closeStream(stream: Ref<MediaStream | undefined>) {
    const s = stream.value
    if (!s)
      return
    s.getTracks().forEach((i) => {
      i.stop()
      s.removeTrack(i)
    })
    stream.value = undefined
  }

  function toggleRecording() {
    if (recording.value)
      stopRecording()
    else
      startRecording()
  }

  useEventListener('beforeunload', (event) => {
    if (!recording.value)
      return
    // eslint-disable-next-line no-alert
    if (confirm('Recording is not saved yet, do you want to leave?'))
      return
    event.preventDefault()
    event.returnValue = ''
  })

  return {
    recording,
    showAvatar,
    toggleRecording,
    startRecording,
    stopRecording,
    toggleAvatar,
    recorderCamera,
    recorderSlides,
    streamCamera,
    streamCapture,
    streamSlides,
  }
}

export const recorder = useRecording()
