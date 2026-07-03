context('Base path deployment', () => {
  after(() => {
    cy.task('stopBasePathServer')
  })

  it('keeps slide navigation relative to the router base', () => {
    // Building the fixture inside the task can take a while, especially on CI
    cy.task<string>('startBasePathServer', undefined, { timeout: 300_000 }).then((url) => {
      cy.visit(`${url}1`)
      cy.get('#page-root > #slide-container > #slide-content')
      cy.get('body').wait(500).type('{rightarrow}')
      cy.url().should('eq', `${url}2`)
    })
  })
})
