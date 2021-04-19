import { computed, Ref, ref, shallowRef, unref, watch } from 'vue'

import Recorder from 'recordrtc'
import type { Options as RecorderOptions } from 'recordrtc'
import { useEventListener, useStorage } from '@vueuse/core'

export const devices = ref<MediaDeviceInfo[]>([])
export const cameras = computed(() => devices.value.filter(i => i.kind === 'videoinput'))
export const microphones = computed(() => devices.value.filter(i => i.kind === 'audioinput'))

export const currentCamera = useStorage<string>('vite-slide-camera', 'default')
export const currentMic = useStorage<string>('vite-slide-mic', 'default')

export async function getDevices() {
  devices.value = await navigator.mediaDevices.enumerateDevices()
  if (currentCamera.value !== 'none') {
    if (!cameras.value.find(i => i.deviceId === currentCamera.value))
      currentCamera.value = cameras.value[0]?.deviceId || 'default'
  }
  if (currentMic.value !== 'none') {
    if (!microphones.value.find(i => i.deviceId === currentMic.value))
      currentMic.value = microphones.value[0]?.deviceId || 'default'
  }
  return devices.value
}

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

  const recorderCamera: Ref<Recorder | undefined> = shallowRef()
  const recorderSlides: Ref<Recorder | undefined> = shallowRef()
  const streamCamera: Ref<MediaStream | undefined> = shallowRef()
  const streamSlides: Ref<MediaStream | undefined> = shallowRef()

  const config: RecorderOptions = {
    type: 'video',
    bitsPerSecond: 4 * 256 * 8 * 1024,
  }

  async function toggleAvatar() {
    if (currentCamera.value === 'none')
      return

    if (showAvatar.value) {
      showAvatar.value = false
      closeCameraStream()
    }
    else {
      await startCameraStream()
      if (streamCamera.value)
        showAvatar.value = !!streamCamera.value
    }
  }

  async function startCameraStream() {
    if (!streamCamera.value) {
      if (currentCamera.value === 'none' && currentMic.value === 'none')
        return

      streamCamera.value = await navigator.mediaDevices.getUserMedia({
        video: currentCamera.value === 'none'
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

  watch(currentCamera, async(v) => {
    if (v === 'none') {
      closeCameraStream()
    }
    else {
      if (recording.value)
        return
      // restart camera stream
      if (streamCamera.value) {
        await closeCameraStream()
        await startCameraStream()
      }
    }
  })

  async function closeCameraStream() {
    if (recording.value)
      return

    if (streamCamera.value) {
      closeStream(streamCamera)
      streamCamera.value = undefined
    }
  }

  async function startRecording() {
    await getDevices()
    await startCameraStream()

    // @ts-expect-error
    streamSlides.value = await navigator.mediaDevices.getDisplayMedia({
      video: {
        aspectRatio: 1.6,
        frameRate: 15,
        width: 3840,
        height: 2160,
        cursor: 'motion',
        resizeMode: 'crop-and-scale',
      },
    })

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
    console.log('started')
    recording.value = true
  }

  async function stopRecording() {
    recording.value = false
    recorderCamera.value?.stopRecording(() => {
      const blob = recorderCamera.value!.getBlob()
      const url = URL.createObjectURL(blob)
      download(`camera-${new Date().toLocaleTimeString().replace(/[:\s_]/g, '-')}.webm`, url)
      window.URL.revokeObjectURL(url)
      closeStream(streamCamera)
      recorderCamera.value = undefined
    })
    recorderSlides.value?.stopRecording(() => {
      const blob = recorderSlides.value!.getBlob()
      const url = URL.createObjectURL(blob)
      download(`slides-${new Date().toLocaleTimeString().replace(/[:\s_]/g, '-')}.webm`, url)
      window.URL.revokeObjectURL(url)
      closeCameraStream()
      recorderSlides.value = undefined
    })

    console.log('stopped')
  }

  function closeStream(stream: Ref<MediaStream | undefined>) {
    const s = unref(stream)
    if (!s)
      return
    s.getTracks().forEach((i) => {
      i.clone()
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
    streamSlides,
  }
}

export const recorder = useRecording()
