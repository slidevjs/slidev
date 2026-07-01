context('Base path deployment', () => {
  before(() => {
    cy.task('startBasePathServer')
  })

  after(() => {
    cy.task('stopBasePathServer')
  })

  it('keeps slide navigation relative to the router base', () => {
    cy.task('assertBasePathNavigation')
  })
})
