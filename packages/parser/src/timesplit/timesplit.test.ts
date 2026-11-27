import { describe, expect, it } from 'vitest'
import { parseTimesplits } from './timesplit'

describe('parseTimesplits', () => {
  it('should parse timestamp into seconds', () => {
    expect(parseTimesplits([
      { no: 1, timesplit: '+10s' },
      { no: 5, timesplit: '10:10' },
      { no: 3, timesplit: '15m' },
      { no: 7, timesplit: '1h10m30s' },
    ])).toMatchInlineSnapshot(`
      [
        {
          "noEnd": 1,
          "noStart": 0,
          "timestampEnd": 10,
          "timestampStart": 0,
          "title": "[start]",
        },
        {
          "noEnd": 5,
          "noStart": 1,
          "timestampEnd": 610,
          "timestampStart": 10,
        },
        {
          "noEnd": 3,
          "noStart": 5,
          "timestampEnd": 900,
          "timestampStart": 610,
        },
        {
          "noEnd": 7,
          "noStart": 3,
          "timestampEnd": 4230,
          "timestampStart": 900,
        },
        {
          "noEnd": 7,
          "noStart": 7,
          "timestampEnd": 4230,
          "timestampStart": 4230,
        },
      ]
    `)
  })
})
