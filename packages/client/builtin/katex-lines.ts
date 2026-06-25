const KATEX_EQUATION_PARENT_SELECTOR = '.mtable > [class*=col-align]'
const KATEX_EQUATION_ROW_SELECTOR = ':scope > .vlist-t > .vlist-r > .vlist > span > .mord'

export function collectKatexEquationLines(el: Element): Element[][] {
  const equationParents = Array.from(el.querySelectorAll(KATEX_EQUATION_PARENT_SELECTOR))
    .filter(parent => !parent.parentElement?.closest(KATEX_EQUATION_PARENT_SELECTOR))

  const lines: Element[][] = []
  for (const equationRowParent of equationParents) {
    const equationRows = Array.from(equationRowParent.querySelectorAll(KATEX_EQUATION_ROW_SELECTOR))
    equationRows.forEach((equationRow, idx) => {
      if (!equationRow)
        return
      if (Array.isArray(lines[idx]))
        lines[idx].push(equationRow)
      else
        lines[idx] = [equationRow]
    })
  }

  return lines
}
