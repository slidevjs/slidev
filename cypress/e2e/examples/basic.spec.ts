export {}
declare global {
  // eslint-disable-next-line ts/no-namespace
  namespace Cypress {
    interface Chainable<Subject> {
      rightArrow: (n?: number) => Chainable<Subject>
    }
  }
}

Cypress.Commands.add('rightArrow', (n = 1) => {
  cy.get('body').wait(500).type('{rightarrow}'.repeat(n)).wait(500)
})

const BASE = 'http://localhost:3041'

context('Basic', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  function goPage(no: number) {
    cy.get('body')
      .wait(100)
      .type('g')
      .wait(100)
      .get('#slidev-goto-input')
      .type(`${no}`, { force: true })
      .type('{enter}', { force: true })
      .url()
      .should('eq', `${BASE}/${no}`)
      .wait(500)
  }

  it('basic nav', () => {
    cy.url()
      .should('eq', `${BASE}/1`)

    cy.contains('Global Footer')
      .should('exist')

    cy.get('#page-root > #slide-container > #slide-content')

    cy.rightArrow()
      .url()
      .should('eq', `${BASE}/2`)

    cy.contains('Global Footer')
      .should('not.exist')

    cy.get('#page-root > #slide-container > #slide-content > #slideshow .slidev-page-2 > div > p')
      .should('have.css', 'border-color', 'rgb(0, 128, 0)')
      .should('not.have.css', 'color', 'rgb(128, 0, 0)')

    goPage(5)

    cy.get('#page-root > #slide-container > #slide-content > #slideshow .slidev-page-5 .slidev-code')
      .should('have.text', '<div>{{$slidev.nav.currentPage}}</div>')
      .get('#page-root > #slide-container > #slide-content > #slideshow .slidev-page-5 > div > p')
      .should('have.text', 'Current Page: 5')
  })

  it('should nav correctly', () => {
    goPage(5)

    cy.get('body')
      .type('{DownArrow}')
      .url()
      .should('eq', `${BASE}/6`)

    cy.rightArrow()

    cy
      .url()
      .should('eq', `${BASE}/6?clicks=1`)

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}')
      .url()
      .should('eq', `${BASE}/7`)

    cy.get('body')
      .type('{LeftArrow}')
      .url()
      .should('eq', `${BASE}/6?clicks=6`)

    cy.get('body')
      .type('{DownArrow}')
      .url()
      .should('eq', `${BASE}/7`)

    cy.get('body')
      .type('{UpArrow}')
      .url()
      .should('eq', `${BASE}/6`)
  })

  it('named slots', () => {
    goPage(8)

    cy.get('.col-right')
      .contains('Right')
  })

  it('clicks map', () => {
    goPage(9)

    cy
      .url()
      .should('eq', `${BASE}/9`)

    cy.rightArrow()

    cy
      .url()
      .should('eq', `${BASE}/9?clicks=1`)

    cy.get('#slideshow .slidev-page-9 .cy-content .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'CD')

    cy.rightArrow(2)

    cy.get('#slideshow .slidev-page-9 .cy-content .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'ABCD')

    // v-click.hide
    cy.rightArrow()

    cy.get('#slideshow .slidev-page-9 .cy-content .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'ABC')

    cy
      .url()
      .should('eq', `${BASE}/9?clicks=4`)

    cy.rightArrow()

    cy
      .url()
      .should('eq', `${BASE}/10`)

    cy.rightArrow()

    cy
      .url()
      .should('eq', `${BASE}/10?clicks=1`)

    cy.get('#slideshow .slidev-page-10 .cy-content-hide .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'BD')

    cy.rightArrow()

    cy.get('#slideshow .slidev-page-10 .cy-content-hide .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'D')

    cy.rightArrow()

    cy.get('#slideshow .slidev-page-10 .cy-content-hide .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'CD')

    cy.rightArrow()

    cy
      .url()
      .should('eq', `${BASE}/10?clicks=4`)

    cy.rightArrow()

    cy
      .url()
      .should('eq', `${BASE}/11`)
  })

  it('overview nav', () => {
    goPage(2)

    cy.get('body')
      .type('o{RightArrow}{RightArrow}{Enter}')
      .url()
      .should('eq', `${BASE}/4`)

    cy.get('body')
      .type('o{LeftArrow}{LeftArrow}{LeftArrow}{Enter}')
      .url()
      .should('eq', `${BASE}/1`)

    cy.get('body')
      .type('o{DownArrow}{DownArrow}{DownArrow}{Enter}')
      .url()
      .should('not.eq', `${BASE}/1`)

    cy.get('body')
      .type('o{UpArrow}{UpArrow}{UpArrow}{Enter}')
      .url()
      .should('eq', `${BASE}/1`)
  })

  it('deep nested lists', () => {
    goPage(11)

    cy
      .url()
      .should('eq', `${BASE}/11`)

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}')

    cy.get('#slideshow .slidev-page-11 .cy-depth .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'C')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}')

    cy.get('#slideshow .slidev-page-11 .cy-depth .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'CD')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}')

    cy.get('#slideshow .slidev-page-11 .cy-depth .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'CDGH')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}')

    cy.get('#slideshow .slidev-page-11 .cy-depth > ul > .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'A B CDEF GHIJKL')
  })

  it('slot in v-clicks', () => {
    goPage(12)

    cy
      .url()
      .should('eq', `${BASE}/12`)

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}')
      .url()
      .should('eq', `${BASE}/12?clicks=6`) // we should still be on page 12

    cy.rightArrow()
      .url()
      .should('eq', `${BASE}/13`)

    cy.get('#slideshow .slidev-page-13 .cy-wrapdecorate > ul > .slidev-vclick-target.slidev-vclick-hidden')
      .should('have.text', 'AEFZ')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}')

    cy.get('#slideshow .slidev-page-13 .cy-wrapdecorate > ul > .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'AEF')

    cy.rightArrow()

    cy.get('#slideshow .slidev-page-13 .cy-wrapdecorate > ul > .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'AEFZ')
  })
})
