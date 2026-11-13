// Typst renders multi-line equations as a MathML <mtable> with one <mtr> per
// line. Aligned equations carry the class `multiline-equation aligned`, plain
// multi-line stacks carry `multiline-equation`. Each <mtr> is one logical line
// for the purpose of click-based line highlighting (`$$ {1|3|all}`).
//
// We deliberately only consider the outermost `multiline-equation` table so
// that nested tables (e.g. `cases`, matrices) are not mistaken for lines.

const TYPST_EQUATION_TABLE_SELECTOR = 'mtable.multiline-equation'
const TYPST_EQUATION_ROW_SELECTOR = ':scope > mtr'

export function collectMathmlEquationLines(el: Element): Element[][] {
  const tables = Array.from(el.querySelectorAll(TYPST_EQUATION_TABLE_SELECTOR))
    .filter(table => !table.parentElement?.closest(TYPST_EQUATION_TABLE_SELECTOR))

  const lines: Element[][] = []
  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll(TYPST_EQUATION_ROW_SELECTOR))
    rows.forEach((row, idx) => {
      if (!row)
        return
      if (Array.isArray(lines[idx]))
        lines[idx].push(row)
      else
        lines[idx] = [row]
    })
  }

  return lines
}
