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

    cy.get('#page-root > #slide-container > #slide-content > .slidev-page-5 > .slidev-code')
      .should('have.text', '<div>{{$slidev.nav.currentPage}}</div>')
      .get('#page-root > #slide-container > #slide-content > .slidev-page-5 > p')
      .should('have.text', 'Current Page: 5')

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

    goPage(8)

    cy.get('.col-right')
      .contains('Right')
  })
})
