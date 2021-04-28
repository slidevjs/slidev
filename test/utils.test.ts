import { getPagesByRange } from '../packages/slidev/node'

describe('utils', () => {
  it('page-range', () => {
    expect(getPagesByRange(5)).toEqual([0, 1, 2, 3, 4])
    expect(getPagesByRange(5, 'all')).toEqual([0, 1, 2, 3, 4])
    expect(getPagesByRange(5, '1')).toEqual([0])
    expect(getPagesByRange(10, '1,2-3,5')).toEqual([0, 1, 2, 4])
    expect(getPagesByRange(10, '1;2-3;5')).toEqual([0, 1, 2, 4])
    expect(getPagesByRange(10, '6-')).toEqual([5, 6, 7, 8, 9])
  })
})
