context('Iframe layout', () => {
  // #2281: the iframe should lay out and rasterize at its real on-screen
  // size, so embedded canvas-based pages are not bitmap-upscaled and blurred
  it('rasterizes at the on-screen size when the slide is scaled up', () => {
    cy.viewport(1960, 1104) // 2x the default 980x552 slide size
    cy.visit('/18')
    cy.get('#slide-content iframe').should(($frame) => {
      const el = $frame[0]
      const rect = el.getBoundingClientRect()
      expect(rect.width, 'displayed width').to.be.closeTo(1960, 2)
      expect(el.offsetWidth, 'layout width').to.be.closeTo(rect.width, 2)
    })
  })

  it('keeps the design-size layout when the slide is scaled down', () => {
    cy.viewport(490, 276) // 0.5x the default 980x552 slide size
    cy.visit('/18')
    cy.get('#slide-content iframe').should(($frame) => {
      const el = $frame[0]
      const rect = el.getBoundingClientRect()
      expect(rect.width, 'displayed width').to.be.closeTo(490, 2)
      expect(el.offsetWidth, 'layout width').to.equal(980)
    })
  })
})
