import { Ref, ref, shallowRef, unref } from 'vue'

import Recorder from 'recordrtc'
import type { Options as RecorderOptions } from 'recordrtc'
import { MaybeRef, useEventListener } from '@vueuse/core'

export function useRecording() {
  const recording = ref(false)
  const showAvatar = ref(true)

  function download(name: string, url: string) {
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', name)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const recorderCamera: Ref<Recorder | undefined> = shallowRef()
  const recorderSlides: Ref<Recorder | undefined> = shallowRef()
  const streamCamera: Ref<MediaStream | undefined> = shallowRef()
  const streamSlides: Ref<MediaStream | undefined> = shallowRef()

  const config: RecorderOptions = {
    type: 'video',
    bitsPerSecond: 4 * 256 * 8 * 1024,
  }

  async function startRecording() {
    streamCamera.value = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: {
        deviceId: {
          exact: '5d446bf64a1e9b67ef2da996e2a777cf744be03562cdd39099b20ba80f42db0a',
        },
      },
    })
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
    streamSlides.value!.addTrack(streamCamera.value.getAudioTracks()[0])

    recorderCamera.value = new Recorder(
      streamCamera.value,
      config,
    )
    recorderSlides.value = new Recorder(
      streamSlides.value!,
      config,
    )

    recorderCamera.value.startRecording()
    recorderSlides.value.startRecording()
    console.log('started')
    recording.value = true
  }

  async function stopRecording() {
    recorderCamera.value?.stopRecording(() => {
      const blob = recorderCamera.value!.getBlob()
      const url = URL.createObjectURL(blob)
      download(`camera-${new Date().toLocaleTimeString().replace(/[:\s_]/g, '-')}.webm`, url)
      window.URL.revokeObjectURL(url)
      closeStream(streamCamera)
      recorderCamera.value = undefined
      streamCamera.value = undefined
    })
    recorderSlides.value?.stopRecording(() => {
      const blob = recorderSlides.value!.getBlob()
      const url = URL.createObjectURL(blob)
      download(`slides-${new Date().toLocaleTimeString().replace(/[:\s_]/g, '-')}.webm`, url)
      window.URL.revokeObjectURL(url)
      closeStream(streamSlides)
      recorderSlides.value = undefined
      streamSlides.value = undefined
    })
    recording.value = false

    console.log('stopped')
  }

  function closeStream(stream: MaybeRef<MediaStream | undefined>) {
    const s = unref(stream)
    if (!s)
      return
    s.getTracks().forEach((i) => {
      i.clone()
      s.removeTrack(i)
    })
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
    recorderCamera,
    recorderSlides,
    streamCamera,
    streamSlides,
  }
}

export const recorder = useRecording()
