context('Base path deployment', () => {
  after(() => {
    cy.task('stopBasePathServer')
  })

  // `history` (#2629) and `hash` (#2622) both regressed in 52.16.0: navigation
  // duplicated the `--base` into the pushed path. Guard both router modes.
  for (const [routerMode, slidePath] of [['history', ''], ['hash', '#/']] as const) {
    it(`keeps slide navigation relative to the router base (${routerMode} mode)`, () => {
      // Building the fixture inside the task can take a while, especially on CI
      cy.task<string>('startBasePathServer', routerMode, { timeout: 300_000 }).then((url) => {
        cy.visit(`${url}${slidePath}1`)
        cy.get('#page-root > #slide-container > #slide-content')
        cy.get('body').wait(500).type('{rightarrow}')
        cy.url().should('eq', `${url}${slidePath}2`)
      })
    })
  }
})
