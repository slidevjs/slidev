export function getKatexEquationRows(el: Element): Element[][] {
  const equationParents = Array.from(el.querySelectorAll('.mtable > [class*=col-align]'))
    .filter(isTopLevelKatexColumn)

  const equationRowsOfEachParent = equationParents
    .map(item => Array.from(item.querySelectorAll(':scope > .vlist-t > .vlist-r > .vlist > span > .mord')))

  const lines: Element[][] = []
  for (const equationRowParent of equationRowsOfEachParent) {
    equationRowParent.forEach((equationRow, idx) => {
      if (Array.isArray(lines[idx]))
        lines[idx].push(equationRow)
      else
        lines[idx] = [equationRow]
    })
  }

  return lines
}

function isTopLevelKatexColumn(column: Element) {
  const table = column.parentElement
  return !!table && !table.parentElement?.closest('.mtable')
}
