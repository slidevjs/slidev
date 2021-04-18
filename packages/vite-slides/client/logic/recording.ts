import { Ref, ref, shallowRef, unref } from 'vue'

import Recorder from 'recordrtc'
import type { Options as RecorderOptions } from 'recordrtc'
import { MaybeRef } from '@vueuse/core'

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
      audio: true,
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
      download('camera.webm', url)
      window.URL.revokeObjectURL(url)
      closeStream(streamCamera)
      recorderCamera.value = undefined
      streamCamera.value = undefined
    })
    recorderSlides.value?.stopRecording(() => {
      const blob = recorderSlides.value!.getBlob()
      const url = URL.createObjectURL(blob)
      download('screen.webm', url)
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
