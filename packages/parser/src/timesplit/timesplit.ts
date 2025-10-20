import { parseTimestampString } from './timestamp'

export interface TimesplitInput {
  no: number
  timesplit: string
  title?: string
}

export interface TimesplitOutput {
  timestampStart: number
  timestampEnd: number
  noStart: number
  noEnd: number
  title?: string
}

export function parseTimesplits(inputs: TimesplitInput[]): TimesplitOutput[] {
  let ts = 0
  const outputs: TimesplitOutput[] = []
  let current: TimesplitOutput = {
    timestampStart: ts,
    timestampEnd: ts,
    noStart: 0,
    noEnd: 0,
    title: '[start]',
  }
  outputs.push(current)
  for (const input of inputs) {
    const time = parseTimestampString(input.timesplit)
    const end = time.relative
      ? ts + time.seconds
      : time.seconds
    if (end < ts) {
      throw new Error(`Timesplit end ${end} is before start ${ts}`)
    }
    current.timestampEnd = end
    current.noEnd = input.no
    if (input.title) {
      current.title = input.title
    }
    ts = end
    current = {
      timestampStart: end,
      timestampEnd: end,
      noStart: input.no,
      noEnd: input.no,
    }
    outputs.push(current)
  }
  return outputs
}
