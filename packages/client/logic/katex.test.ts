import { describe, expect, it } from 'vitest'
import { getKatexEquationRows } from './katex'

describe('getKatexEquationRows', () => {
  it('ignores nested KaTeX tables when collecting equation rows', () => {
    const leftRows = createRows('left', 3)
    const rightRows = createRows('right', 3)

    const root = {
      querySelectorAll(selector: string) {
        expect(selector).toBe('.mtable > [class*=col-align]')
        return [
          createColumn(leftRows),
          createColumn(rightRows),
          createColumn(createRows('substack', 2), true),
          createColumn(createRows('matrix', 4), true),
        ]
      },
    } as unknown as Element

    expect(getKatexEquationRows(root)).toEqual([
      [leftRows[0], rightRows[0]],
      [leftRows[1], rightRows[1]],
      [leftRows[2], rightRows[2]],
    ])
  })
})

function createColumn(rows: Element[], nested = false) {
  return {
    parentElement: {
      parentElement: {
        closest(selector: string) {
          expect(selector).toBe('.mtable')
          return nested ? {} : null
        },
      },
    },
    querySelectorAll(selector: string) {
      expect(selector).toBe(':scope > .vlist-t > .vlist-r > .vlist > span > .mord')
      return rows
    },
  } as unknown as Element
}

function createRows(name: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({ name, index } as unknown as Element))
}
