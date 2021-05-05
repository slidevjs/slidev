// @ts-check

const Guide = [
  {
    text: 'Why Slidev',
    link: '/guide/why',
  },
  {
    text: 'Getting Started',
    link: '/guide/',
  },
  {
    text: 'Installation',
    link: '/guide/install',
  },
  {
    text: 'Markdown Syntax',
    link: '/guide/syntax',
  },
  {
    text: 'Animations',
    link: '/guide/animations',
  },
  {
    text: 'Exporting',
    link: '/guide/exporting',
  },
  {
    text: 'Record Presentation',
    link: '/guide/recording',
  },
  {
    text: 'Presenter Mode',
    link: '/guide/presenter-mode',
  },
  {
    text: 'Editor Integrations',
    link: '/guide/editors',
  },
]

const Theme = [
  {
    text: 'Use Theme',
    link: '/themes/use',
  },
  {
    text: 'Theme Gallery',
    link: '/themes/gallery',
  },
  {
    text: 'Write a Theme',
    link: '/themes/write-a-theme',
  },
]

const Customizations = [
  {
    text: 'Customizations',
    link: '/custom/',
  },
  {
    text: 'Directory Structure',
    link: '/custom/directory-structure',
  },
  {
    text: 'Highlighters',
    link: '/custom/highlighters',
  },
  {
    text: 'Configure Vite',
    link: '/custom/config-vite',
  },
  {
    text: 'Configure Windi CSS',
    link: '/custom/config-windicss',
  },
  {
    text: 'Configure Monaco',
    link: '/custom/config-monaco',
  },
]

const slidebars = [
  {
    text: 'Guide',
    children: Guide,
  },
  {
    text: 'Themes',
    children: Theme,
  },
  {
    text: 'Customizations',
    children: Customizations,
  },
  {
    text: 'Built-in',
    children: [
      {
        text: 'Components',
        link: '/builtin/components',
      },
      {
        text: 'Layouts',
        link: '/builtin/layouts',
      },
    ],
  },
]

/**
 * @type {import('vitepress').UserConfig}
 */
module.exports = {
  title: 'Slidev',
  description: 'Presentation slides for developers',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    ['meta', { name: 'author', content: 'Slidev' }],
    ['meta', { property: 'og:title', content: 'VueUse' }],
    ['meta', { property: 'og:image', content: 'https://sli.dev/og-image.png' }],
    ['meta', { property: 'og:description', content: 'Presentation slides for developers' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:creator', content: '@slidevjs' }],
    ['meta', { name: 'twitter:image', content: 'https://sli.dev/og-image.png' }],
    ['link', { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' }],
    ['link', { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://fonts.gstatic.com' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@200;400;500&family=Inter:wght@200;400;500;600', rel: 'stylesheet' }],
  ],
  themeConfig: {
    repo: 'slidevjs/slidev',
    logo: '/logo.svg',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
    editLinkText: 'Suggest changes to this page',

    nav: [
      {
        text: 'Guide',
        items: Guide,
      },
      {
        text: 'Theme',
        items: Theme,
      },
      {
        text: 'Customize',
        items: Customizations,
      },
      { text: 'Showcases', link: '/showcases' },
    ],

    sidebar: {
      '/guide/': slidebars,
      '/themes/': slidebars,
      '/custom/': slidebars,
      '/builtin/': slidebars,
      '/': slidebars,
    },
  },
}
