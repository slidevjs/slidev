const LAYOUT_KEY = 'slidev-presenter-layout'

function visitPresenter(layout: 1 | 2 | 3) {
  cy.visit('/presenter', {
    onBeforeLoad(win) {
      win.localStorage.setItem(LAYOUT_KEY, String(layout))
    },
  })
}

context('Presenter resizer', () => {
  it('shows proper resizer handles per layout', () => {
    // Start with a tall viewport so layout 1 is not in wide mode.
    cy.viewport(900, 1200)
    visitPresenter(1)

    cy.get('.note .notes-resizer').should('exist')
    cy.get('.note .notes-row-resizer').should('exist')
    cy.get('.next .notes-row-resizer').should('not.exist')
    cy.get('.notes-vertical-resizer').should('not.exist')

    // Switch to wide mode: unified vertical resizer should exist.
    cy.viewport(1400, 900)
    cy.get('.notes-vertical-resizer').should('exist')
    cy.get('.note .notes-resizer').should('not.exist')

    visitPresenter(2)

    cy.get('.note .notes-resizer').should('exist')
    cy.get('.next .notes-row-resizer').should('exist')
    cy.get('.note .notes-row-resizer').should('not.exist')
    cy.get('.notes-vertical-resizer').should('not.exist')

    visitPresenter(3)

    cy.get('.note .notes-resizer').should('not.exist')
    cy.get('.note .notes-row-resizer').should('exist')
    cy.get('.next .notes-row-resizer').should('not.exist')
    cy.get('.notes-vertical-resizer').should('not.exist')
    cy.get('.notes-vertical-resizer-left').should('exist')
  })

  it('applies CSS variables for dynamic sizing', () => {
    visitPresenter(1)

    cy.get('.grid-container')
      .invoke('attr', 'style')
      .then((style) => {
        expect(style).to.include('--slidev-presenter-notes-width')
        expect(style).to.include('--slidev-presenter-notes-row-size')
      })
  })
})
