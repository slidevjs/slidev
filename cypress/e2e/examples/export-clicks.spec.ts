const BASE = 'http://localhost:3041'

context('Export print-mode settle signal', () => {
  it('one-piece print mode marks every rendered slide as settled', () => {
    cy.visit(`${BASE}/print?print=clicks`)

    // Wait until every rendered SlideWrapper has reported settle. This is the
    // contract the Node-side export pipeline depends on before snapshotting.
    cy.get('[data-slidev-no]', { timeout: 30000 })
      .should('have.length.greaterThan', 0)
      .then(($all) => {
        cy.get('[data-slidev-no][data-slidev-print-ready]', { timeout: 30000 })
          .should('have.length', $all.length)
      })
  })

  it('regression #2034: first rendered instance for a v-clicks slide is the empty state', () => {
    cy.visit(`${BASE}/print?print=clicks`)
    // Slide 6 in the basic fixture has <v-clicks> blocks. The first SlideWrapper
    // rendered for slide 6 must carry data-slidev-print-ready="0" — the empty
    // state — not the final state.
    cy.get('[data-slidev-no="6"][data-slidev-print-ready]', { timeout: 30000 })
      .first()
      .should('have.attr', 'data-slidev-print-ready', '0')
  })

  it('per-slide print mode marks the requested clicks state as settled', () => {
    cy.visit(`${BASE}/6?print=clicks`)
    cy.get('[data-slidev-no="6"][data-slidev-print-ready="0"]', { timeout: 30000 })
      .should('exist')

    cy.visit(`${BASE}/6?print=clicks&clicks=3`)
    cy.get('[data-slidev-no="6"][data-slidev-print-ready="3"]', { timeout: 30000 })
      .should('exist')
  })

  it('live mode does NOT write the settle attribute', () => {
    cy.visit(`${BASE}/6`)
    cy.get('[data-slidev-no="6"]', { timeout: 30000 })
      .should('exist')
      .and('not.have.attr', 'data-slidev-print-ready')
  })
})
