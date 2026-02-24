const ROW_KEY = 'slidev-presenter-notes-row-size-by-layout'
const WIDTH_KEY = 'slidev-presenter-notes-width'
const LAYOUT_KEY = 'slidev-presenter-layout'

function visitPresenter(layout: 1 | 2 | 3) {
  cy.visit('/presenter', {
    onBeforeLoad(win) {
      win.localStorage.setItem(LAYOUT_KEY, String(layout))
    },
  })
}

function resetResizerStorage() {
  cy.visit('/presenter', {
    onBeforeLoad(win) {
      win.localStorage.removeItem(WIDTH_KEY)
      win.localStorage.removeItem(ROW_KEY)
      win.localStorage.removeItem('slidev-presenter-notes-row-size')
      win.localStorage.removeItem(LAYOUT_KEY)
    },
  })
}

context('Presenter resizer', () => {
  beforeEach(() => {
    resetResizerStorage()
  })

  it('shows proper resizer handles per layout', () => {
    visitPresenter(1)

    cy.get('.note .notes-resizer').should('exist')
    cy.get('.note .notes-row-resizer').should('exist')
    cy.get('.next .notes-row-resizer').should('not.exist')

    visitPresenter(2)

    cy.get('.note .notes-resizer').should('exist')
    cy.get('.next .notes-row-resizer').should('exist')
    cy.get('.note .notes-row-resizer').should('not.exist')

    visitPresenter(3)

    cy.get('.note .notes-resizer').should('exist')
    cy.get('.note .notes-row-resizer').should('exist')
    cy.get('.next .notes-row-resizer').should('not.exist')
  })

  it('applies persisted width and per-layout row-size variables', () => {
    visitPresenter(2)

    cy.window().then((win) => {
      win.localStorage.setItem(WIDTH_KEY, '420')
      win.localStorage.setItem(ROW_KEY, JSON.stringify({ 1: 300, 2: 260, 3: 340 }))
    })

    cy.reload()

    cy.get('.grid-container')
      .invoke('attr', 'style')
      .then((style) => {
        expect(style).to.include('--slidev-presenter-notes-width: 420px')
        expect(style).to.include('--slidev-presenter-notes-row-size: 260px')
      })

    visitPresenter(3)

    cy.get('.grid-container')
      .invoke('attr', 'style')
      .then((style) => {
        expect(style).to.include('--slidev-presenter-notes-row-size: 340px')
      })
  })

  it('migrates legacy row-size key to by-layout map', () => {
    cy.visit('/presenter', {
      onBeforeLoad(win) {
        win.localStorage.setItem('slidev-presenter-notes-row-size', '280')
        win.localStorage.removeItem(ROW_KEY)
      },
    })

    cy.window().should((win) => {
      const raw = win.localStorage.getItem(ROW_KEY)
      const map = JSON.parse(raw || '{}') as Record<string, number | null>
      expect(map['1']).to.equal(280)
      expect(map['2']).to.equal(280)
      expect(map['3']).to.equal(280)
    })
  })
})
