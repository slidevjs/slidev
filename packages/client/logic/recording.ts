import type { Ref } from 'vue'
import { nextTick, ref, shallowRef, watch } from 'vue'
import { useDevicesList, useEventListener, useLocalStorage } from '@vueuse/core'
import { isTruthy } from '@antfu/utils'
import type RecorderType from 'recordrtc'
import type { Options as RecorderOptions } from 'recordrtc'
import { currentCamera, currentMic } from '../state'

type Defined<T> = T extends undefined ? never : T
type MimeType = Defined<RecorderOptions['mimeType']>

export const recordingName = ref('')
export const recordCamera = ref(true)
export const mimeType = useLocalStorage<MimeType>('slidev-record-mimetype', 'video/webm')

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
      if (!cameras.value.find(i => i.deviceId === currentCamera.value))
        currentCamera.value = cameras.value[0]?.deviceId || 'default'
    }
    if (currentMic.value !== 'none') {
      if (!microphones.value.find(i => i.deviceId === currentMic.value))
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

  const config: RecorderOptions = {
    type: 'video',
    bitsPerSecond: 4 * 256 * 8 * 1024,
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

  async function startCameraStream() {
    await ensureDevicesListPermissions()
    await nextTick()
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
          : {
              deviceId: currentMic.value,
            },
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
    await startCameraStream()

    streamCapture.value = await navigator.mediaDevices.getDisplayMedia({
      video: {
        // aspectRatio: 1.6,
        frameRate: 15,
        width: 3840,
        height: 2160,
        // @ts-expect-error missing types
        cursor: 'motion',
        resizeMode: 'crop-and-scale',
      },
    })
    streamCapture.value.addEventListener('inactive', stopRecording)

    // We need to create a new Stream to merge video and audio to have the inactive event working on streamCapture
    streamSlides.value = new MediaStream()
    streamCapture.value!.getVideoTracks().forEach(videoTrack => streamSlides.value!.addTrack(videoTrack))

    // merge config
    Object.assign(config, customConfig)

    if (streamCamera.value) {
      const audioTrack = streamCamera.value!.getAudioTracks()?.[0]
      if (audioTrack)
        streamSlides.value!.addTrack(audioTrack)

      recorderCamera.value = new Recorder(
        streamCamera.value!,
        config,
      )
      recorderCamera.value.startRecording()
    }

    recorderSlides.value = new Recorder(
      streamSlides.value!,
      config,
    )

    recorderSlides.value.startRecording()
    recording.value = true
  }

  async function stopRecording() {
    recording.value = false
    recorderCamera.value?.stopRecording(() => {
      if (recordCamera.value) {
        const blob = recorderCamera.value!.getBlob()
        const url = URL.createObjectURL(blob)
        download(getFilename('camera', config.mimeType), url)
        window.URL.revokeObjectURL(url)
      }
      recorderCamera.value = undefined
      if (!showAvatar.value)
        closeStream(streamCamera)
    })
    recorderSlides.value?.stopRecording(() => {
      const blob = recorderSlides.value!.getBlob()
      const url = URL.createObjectURL(blob)
      download(getFilename('screen', config.mimeType), url)
      window.URL.revokeObjectURL(url)
      closeStream(streamCapture)
      closeStream(streamSlides)
      recorderSlides.value = undefined
    })
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
