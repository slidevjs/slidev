import type { NoiseSuppressionMode } from './recording-audio'
import { GtcrnWorkletNode, loadGtcrn, loadRnnoise, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor'
import gtcrnWasmPath from '@sapphi-red/web-noise-suppressor/gtcrn.wasm?url'
import gtcrnWorkletPath from '@sapphi-red/web-noise-suppressor/gtcrnWorklet.js?url'
import rnnoiseWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url'
import rnnoiseWasmSimdPath from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url'
import rnnoiseWorkletPath from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url'

type NoiseSuppressionNode = AudioNode & { destroy: () => void }

export interface NoiseSuppressionPipeline {
  destination: MediaStreamAudioDestinationNode
  close: () => void
}

export function createNoiseSuppressionPipelineHandle(
  context: AudioContext,
  destination: MediaStreamAudioDestinationNode,
  node: NoiseSuppressionNode,
  source: MediaStreamAudioSourceNode,
): NoiseSuppressionPipeline {
  let closed = false

  return {
    destination,
    close() {
      if (closed)
        return
      closed = true

      source.disconnect()
      node.disconnect()
      node.destroy()
      destination.stream.getTracks().forEach(track => track.stop())
      void context.close()
    },
  }
}

let rnnoiseWasmBinary: Promise<ArrayBuffer> | undefined
let gtcrnWasmBinary: Promise<ArrayBuffer> | undefined

function loadRnnoiseWasm() {
  rnnoiseWasmBinary ||= loadRnnoise({
    url: rnnoiseWasmPath,
    simdUrl: rnnoiseWasmSimdPath,
  })
  return rnnoiseWasmBinary
}

function loadGtcrnWasm() {
  gtcrnWasmBinary ||= loadGtcrn({ url: gtcrnWasmPath })
  return gtcrnWasmBinary
}

export async function createNoiseSuppressionPipeline(
  stream: MediaStream,
  mode: Exclude<NoiseSuppressionMode, 'disabled' | 'browser'>,
): Promise<NoiseSuppressionPipeline> {
  // RNNoise and GTCRN are designed to process audio at 48 kHz.
  const context = new AudioContext({ sampleRate: 48_000 })
  let node: NoiseSuppressionNode | undefined
  let source: MediaStreamAudioSourceNode | undefined

  try {
    if (!context.audioWorklet)
      throw new Error('AudioWorklet is not supported')

    if (mode === 'rnnoise') {
      const wasmBinary = await loadRnnoiseWasm()
      await context.audioWorklet.addModule(rnnoiseWorkletPath)
      node = new RnnoiseWorkletNode(context, { wasmBinary, maxChannels: 2 })
    }
    else {
      const wasmBinary = await loadGtcrnWasm()
      await context.audioWorklet.addModule(gtcrnWorkletPath)
      node = new GtcrnWorkletNode(context, { wasmBinary, maxChannels: 2 })
    }

    source = context.createMediaStreamSource(stream)
    const destination = context.createMediaStreamDestination()
    source.connect(node)
    node.connect(destination)
    await context.resume()

    return createNoiseSuppressionPipelineHandle(context, destination, node, source)
  }
  catch (error) {
    source?.disconnect()
    node?.disconnect()
    node?.destroy()
    await context.close().catch(() => {})
    throw error
  }
}
