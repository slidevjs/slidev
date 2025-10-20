import { parseTimestampString } from './timestamp'

export interface TimesplitInput {
  no: number
  timesplit: string
  name?: string
}

export interface TimesplitOutput {
  timestampStart: number
  timestampEnd: number
  noStart: number
  noEnd: number
  name?: string
}

export function parseTimesplits(inputs: TimesplitInput[]): TimesplitOutput[] {
  let ts = 0
  const outputs: TimesplitOutput[] = []
  let current: TimesplitOutput = {
    timestampStart: ts,
    timestampEnd: ts,
    noStart: 0,
    noEnd: 0,
    name: '[start]',
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
    if (input.name) {
      current.name = input.name
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
