context('Basic', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  function goPage(no: number) {
    cy.get('body')
      .type('g')
      .get('#slidev-goto-dialog')
      .type(`${no}{enter}`)
      .url()
      .should('eq', `http://localhost:3030/${no}`)
  }

  it('basic nav', () => {
    cy.url()
      .should('eq', 'http://localhost:3030/1')

    cy.contains('Global Footer')
      .should('exist')

    cy.get('#page-root > #slide-container > #slide-content')

    cy.get('body')
      .type('{RightArrow}')
      .url()
      .should('eq', 'http://localhost:3030/2')

    cy.contains('Global Footer')
      .should('not.exist')

    cy.get('#page-root > #slide-container > #slide-content > .slidev-page-2 > p')
      .should('have.css', 'border-color', 'rgb(0, 128, 0)')
      .should('not.have.css', 'color', 'rgb(128, 0, 0)')

    goPage(5)

    cy.get('#page-root > #slide-container > #slide-content > .slidev-page-5 .slidev-code')
      .should('have.text', '<div>{{$slidev.nav.currentPage}}</div>')
      .get('#page-root > #slide-container > #slide-content > .slidev-page-5 > p')
      .should('have.text', 'Current Page: 5')
  })

  it('should nav correctly', () => {
    goPage(5)

    cy.get('body')
      .type('{DownArrow}')
      .url().should('eq', 'http://localhost:3030/6')

    cy.get('body')
      .type('{RightArrow}')

    cy
      .url()
      .should('eq', 'http://localhost:3030/6?clicks=1')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}')
      .url().should('eq', 'http://localhost:3030/7')

    cy.get('body')
      .type('{LeftArrow}')
      .url()
      .should('eq', 'http://localhost:3030/6?clicks=6')

    cy.get('body')
      .type('{DownArrow}')
      .url()
      .should('eq', 'http://localhost:3030/7')

    cy.get('body')
      .type('{UpArrow}')
      .url()
      .should('eq', 'http://localhost:3030/6')
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
      .should('eq', 'http://localhost:3030/9')

    cy.get('body')
      .type('{RightArrow}')

    cy
      .url()
      .should('eq', 'http://localhost:3030/9?clicks=1')

    cy.get('.cy-content .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'CDE')

    cy.get('body')
      .type('{RightArrow}')
      .type('{RightArrow}')

    cy.get('.cy-content .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'ABCDE')

    // v-click.hide
    cy.get('body')
      .type('{RightArrow}')
      .type('{RightArrow}')

    cy.get('.cy-content .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'ABC')

    cy
      .url()
      .should('eq', 'http://localhost:3030/9?clicks=5')

    cy.get('body')
      .type('{RightArrow}')

    cy
      .url()
      .should('eq', 'http://localhost:3030/10')

    cy.get('body')
      .type('{RightArrow}')

    cy
      .url()
      .should('eq', 'http://localhost:3030/10?clicks=1')

    cy.get('.cy-content-hide .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'BD')

    cy.get('body')
      .type('{RightArrow}')

    cy.get('.cy-content-hide .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'D')

    cy.get('body')
      .type('{RightArrow}')

    cy.get('.cy-content-hide .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'CD')

    cy.get('body')
      .type('{RightArrow}')

    cy
      .url()
      .should('eq', 'http://localhost:3030/10?clicks=4')

    cy.get('body')
      .type('{RightArrow}')

    cy
      .url()
      .should('eq', 'http://localhost:3030/11')
  })

  it('overview nav', () => {
    goPage(2)

    cy.get('body')
      .type('o{RightArrow}{RightArrow}{Enter}')
      .url()
      .should('eq', 'http://localhost:3030/4')

    cy.get('body')
      .type('o{LeftArrow}{LeftArrow}{LeftArrow}{Enter}')
      .url()
      .should('eq', 'http://localhost:3030/1')

    cy.get('body')
      .type('o{DownArrow}{DownArrow}{DownArrow}{Enter}')
      .url()
      .should('not.eq', 'http://localhost:3030/1')

    cy.get('body')
      .type('o{UpArrow}{UpArrow}{UpArrow}{Enter}')
      .url()
      .should('eq', 'http://localhost:3030/1')
  })
})
