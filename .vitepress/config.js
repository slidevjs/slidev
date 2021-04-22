// @ts-check

/**
 * @type {import('vitepress').UserConfig}
 */
module.exports = {
  title: 'Slidev',
  description: 'Presentation slides for developers',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' }],
  ['link', { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://fonts.gstatic.com' }],
  ['link', { href: 'https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:wght@200;400;500;600&display=swap', rel: 'stylesheet' }],
  ],
  themeConfig: {
    repo: 'antfu/slidev',
    logo: '/logo.svg',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
    editLinkText: 'Suggest changes to this page',

    nav: [
      { text: 'Guide', link: '/guide/' },
    ],
  }
}
