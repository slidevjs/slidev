context('Smoke test', () => {
  async function testAllSlides() {
    while (1) {
      let oldUrl, newUrl
      cy.get('body')
        .url()
        .then(url => (oldUrl = url))
        .type(`{RightArrow}`)
        .wait(1000)
        .url()
        .then(url => (newUrl = url))
      if (oldUrl === newUrl)
        break
    }
  }

  it('should throw no error in Play mode', async () => {
    cy.visit('/').wait(4000)
    await testAllSlides()
  })

  it('should throw no error in Presenter mode', async () => {
    cy.visit('/presenter').wait(4000)
    await testAllSlides()
  })

  it('should throw no error in Overview page', async () => {
    cy.visit('/overview').wait(4000)
  })

  it('should throw no error in Entry page', async () => {
    cy.visit('/entry').wait(4000)
  })
})
