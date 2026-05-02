import { describe, expect, it } from 'vitest'
import { collectKatexEquationLines } from './katex-lines'

function fakeElement(options: {
  parent?: Element | null
  closest?: Element | null
  children?: Element[]
} = {}) {
  const el = {
    parentElement: options.parent ?? null,
    closest: () => options.closest ?? null,
    querySelectorAll: () => options.children ?? [],
  }
  return el as unknown as Element
}

describe('collectKatexEquationLines', () => {
  it('ignores nested KaTeX tables when mapping equation lines', () => {
    const rowA1 = fakeElement()
    const rowA2 = fakeElement()
    const rowB1 = fakeElement()
    const rowB2 = fakeElement()
    const nestedRow = fakeElement()

    const outerLeftParent = fakeElement({ children: [rowA1, rowA2] })
    const outerRightParent = fakeElement({ children: [rowB1, rowB2] })
    const nestedParent = fakeElement({
      parent: fakeElement({ closest: outerLeftParent }),
      children: [nestedRow],
    })

    const root = fakeElement({
      children: [outerLeftParent, nestedParent, outerRightParent],
    })

    expect(collectKatexEquationLines(root)).toEqual([
      [rowA1, rowB1],
      [rowA2, rowB2],
    ])
  })
})
