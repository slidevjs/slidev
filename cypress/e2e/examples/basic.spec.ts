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
  cy.get('body').wait(500).type('{rightarrow}'.repeat(n), { delay: 10 }).wait(500)
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
      .type('{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}', { delay: 10 })
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
      .type('o{RightArrow}{RightArrow}{Enter}', { delay: 10 })
      .url()
      .should('eq', `${BASE}/4`)

    cy.get('body')
      .type('o{LeftArrow}{LeftArrow}{LeftArrow}{Enter}', { delay: 10 })
      .url()
      .should('eq', `${BASE}/1`)

    cy.get('body')
      .type('o{DownArrow}{DownArrow}{DownArrow}{Enter}', { delay: 10 })
      .url()
      .should('not.eq', `${BASE}/1`)

    cy.get('body')
      .type('o{UpArrow}{UpArrow}{UpArrow}{Enter}', { delay: 10 })
      .url()
      .should('eq', `${BASE}/1`)
  })

  it('deep nested lists', () => {
    goPage(11)

    cy
      .url()
      .should('eq', `${BASE}/11`)

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}', { delay: 10 })

    cy.get('#slideshow .slidev-page-11 .cy-depth .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'C')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}', { delay: 10 })

    cy.get('#slideshow .slidev-page-11 .cy-depth .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'CD')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}', { delay: 10 })

    cy.get('#slideshow .slidev-page-11 .cy-depth .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden) .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'CDGH')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}', { delay: 10 })

    cy.get('#slideshow .slidev-page-11 .cy-depth > ul > .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'A B CDEF GHIJKL')
  })

  it('slot in v-clicks', () => {
    goPage(12)

    cy
      .url()
      .should('eq', `${BASE}/12`)

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}{RightArrow}', { delay: 10 })
      .url()
      .should('eq', `${BASE}/12?clicks=6`) // we should still be on page 12

    cy.rightArrow()
      .url()
      .should('eq', `${BASE}/13`)

    cy.get('#slideshow .slidev-page-13 .cy-wrapdecorate > ul > .slidev-vclick-target.slidev-vclick-hidden')
      .should('have.text', 'AEFZ')

    cy.get('body')
      .type('{RightArrow}{RightArrow}{RightArrow}', { delay: 10 })

    cy.get('#slideshow .slidev-page-13 .cy-wrapdecorate > ul > .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'AEF')

    cy.rightArrow()

    cy.get('#slideshow .slidev-page-13 .cy-wrapdecorate > ul > .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'AEFZ')
  })

  it('click animation presets', () => {
    goPage(14)

    // Check animation classes are set on mount
    cy.get('#slideshow .slidev-page-14 .cy-animation-presets .slidev-vclick-target').eq(0).should('have.class', 'slidev-vclick-anim-fade').and('have.class', 'slidev-vclick-anim-up')
    cy.get('#slideshow .slidev-page-14 .cy-animation-presets .slidev-vclick-target').eq(1).should('have.class', 'slidev-vclick-anim-scale')
    cy.get('#slideshow .slidev-page-14 .cy-animation-presets .slidev-vclick-target').eq(2).should('have.class', 'slidev-vclick-anim-none')

    // After clicks, elements become visible
    cy.rightArrow()
    cy.get('#slideshow .slidev-page-14 .cy-animation-presets .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'fade-up')

    cy.rightArrow()
    cy.get('#slideshow .slidev-page-14 .cy-animation-presets .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.length', 2)

    cy.rightArrow()
    cy.get('#slideshow .slidev-page-14 .cy-animation-presets .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.length', 3)
  })

  it('click animation from frontmatter', () => {
    goPage(15)

    cy.get('#slideshow .slidev-page-15 .cy-animation-frontmatter .slidev-vclick-target')
      .should('have.class', 'slidev-vclick-anim-fade')
      .and('have.class', 'slidev-vclick-anim-down')

    cy.rightArrow()
    cy.get('#slideshow .slidev-page-15 .cy-animation-frontmatter .slidev-vclick-target:not(.slidev-vclick-hidden)')
      .should('have.text', 'from-frontmatter')
  })

  it('click animation hierarchy and override', () => {
    goPage(16)

    const targets = '#slideshow .slidev-page-16 .cy-animation-hierarchy .slidev-vclick-target'

    // custom frontmatter still gets reflected for elements without modifiers
    cy.get(targets).eq(0).should('have.class', 'slidev-vclick-anim-foo')

    // element modifiers override slide frontmatter preset
    cy.get(targets).eq(1).should('not.have.class', 'slidev-vclick-anim-foo').and('have.class', 'slidev-vclick-anim-fade').and('have.class', 'slidev-vclick-anim-right')

    // none modifier also overrides slide frontmatter preset
    cy.get(targets).eq(2).should('not.have.class', 'slidev-vclick-anim-foo').and('have.class', 'slidev-vclick-anim-none').invoke('css', 'transition').should('match', /^none/)

    // another valid modifier should also override invalid frontmatter
    cy.get(targets).eq(3).should('not.have.class', 'slidev-vclick-anim-foo').and('have.class', 'slidev-vclick-anim-scale')

    // reveal sequence remains functional with mixed presets
    cy.rightArrow(4)
    cy.get(`${targets}:not(.slidev-vclick-hidden)`)
      .should('have.length', 4)
  })

  it('annotated code block in v-click', () => {
    goPage(17)

    const wrapper = '#slideshow .slidev-page-17 .cy-code-in-vclick .slidev-code-wrapper'

    cy.get(wrapper).should('have.class', 'slidev-vclick-hidden')

    cy.rightArrow()
    cy.get(wrapper).should('not.have.class', 'slidev-vclick-hidden')
  })

  it('v-click.mount', () => {
    goPage(19)

    const expectMounted = (mounted: string[]) => {
      for (const name of ['b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        cy.get(`#slideshow .slidev-page-19 .cy-mount-${name}`).should(mounted.includes(name)
          ? 'exist'
          : 'not.exist')
      }
    }

    expectMounted(['e'])

    cy.rightArrow()
    expectMounted(['e'])

    cy.rightArrow()
    expectMounted(['b', 'c', 'e'])
    // mounted hidden, then shown with the same classes as `v-click`
    cy.get('#slideshow .slidev-page-19 .cy-mount-b')
      .should('have.class', 'slidev-vclick-target')
      .and('not.have.class', 'slidev-vclick-hidden')
      .and('have.css', 'opacity', '1')

    cy.rightArrow()
    expectMounted(['b', 'c', 'd'])

    cy.rightArrow()
    cy.url()
      .should('eq', `${BASE}/19?clicks=4`)
    expectMounted(['b', 'c', 'd', 'f', 'g', 'h'])
    cy.get('#slideshow .slidev-page-19 .cy-mount-f')
      .should('have.class', 'slidev-vclick-anim-up')
      .and('not.have.class', 'slidev-vclick-hidden')

    cy.rightArrow()
    cy.url()
      .should('eq', `${BASE}/19?clicks=5`)
    expectMounted(['b', 'c', 'f', 'g', 'h'])
  })

  it('marks only the currently visible slide with slidev-page-active', () => {
    cy.url().should('eq', `${BASE}/1`)

    // Initial state on slide 1 with preloaded slide 2 mounted in the DOM
    cy.get('#slideshow .slidev-page-active').should('have.length', 1)
    cy.get('#slideshow .slidev-page-1')
      .should('have.class', 'slidev-page')
      .and('have.class', 'slidev-page-active')
      .and('be.visible')
    cy.get('#slideshow .slidev-page-2')
      .should('exist')
      .and('not.be.visible')
      .and('have.class', 'slidev-page')
      .and('not.have.class', 'slidev-page-active')

    // Forward navigation transfers the active class to slide 2
    cy.get('body').type('{RightArrow}')
    cy.url().should('eq', `${BASE}/2`)
    cy.get('#slideshow .slidev-page-active').should('have.length', 1)
    cy.get('#slideshow .slidev-page-2')
      .should('have.class', 'slidev-page')
      .and('have.class', 'slidev-page-active')
      .and('be.visible')
    cy.get('#slideshow .slidev-page-1')
      .should('exist')
      .and('not.be.visible')
      .and('not.have.class', 'slidev-page-active')

    // Backward navigation restores the active class to slide 1
    cy.get('body').type('{LeftArrow}')
    cy.url().should('eq', `${BASE}/1`)
    cy.get('#slideshow .slidev-page-active').should('have.length', 1)
    cy.get('#slideshow .slidev-page-1')
      .should('have.class', 'slidev-page-active')
    cy.get('#slideshow .slidev-page-2')
      .should('not.have.class', 'slidev-page-active')

    // v-click progression keeps the active class on the current slide
    goPage(9)
    cy.get('#slideshow .slidev-page-active').should('have.length', 1)
    cy.get('#slideshow .slidev-page-9')
      .should('have.class', 'slidev-page')
      .and('have.class', 'slidev-page-active')

    cy.get('body').type('{RightArrow}')
    cy.url().should('eq', `${BASE}/9?clicks=1`)
    cy.get('#slideshow .slidev-page-active').should('have.length', 1)
    cy.get('#slideshow .slidev-page-9')
      .should('have.class', 'slidev-page-active')
  })

  it('marks the main slide active in presenter mode without marking Next preview', () => {
    cy.visit('/presenter/9')
    cy.url().should('eq', `${BASE}/presenter/9`)

    cy.get('.grid-section.main #slideshow .slidev-page-active').should('have.length', 1)
    cy.get('.grid-section.main #slideshow .slidev-page-9')
      .should('have.class', 'slidev-page')
      .and('have.class', 'slidev-page-active')

    // Slide 9 has unrevealed clicks, so Next preview renders slide 9 as well
    cy.get('.grid-section.next .slidev-page-9')
      .should('exist')
      .and('have.class', 'slidev-page')
      .and('not.have.class', 'slidev-page-active')
    cy.get('.grid-section.next .slidev-page-active').should('not.exist')
  })
})
