import { parseRangeString } from '../packages/parser/src'

describe('utils', () => {
  it('page-range', () => {
    expect(parseRangeString(5)).toEqual([0, 1, 2, 3, 4])
    expect(parseRangeString(5, 'all')).toEqual([0, 1, 2, 3, 4])
    expect(parseRangeString(5, '1')).toEqual([0])
    expect(parseRangeString(10, '1,2-3,5')).toEqual([0, 1, 2, 4])
    expect(parseRangeString(10, '1;2-3;5')).toEqual([0, 1, 2, 4])
    expect(parseRangeString(10, '6-')).toEqual([5, 6, 7, 8, 9])
  })
})
