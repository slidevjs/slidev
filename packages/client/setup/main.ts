/* __imports__ */

export default function setupMain() {
  function setMaxHeight() {
    // disable the mobile navbar scroll
    // see https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  }
  setMaxHeight()
  window.addEventListener('resize', setMaxHeight)

  /* __injections__ */
}
