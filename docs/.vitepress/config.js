// @ts-check

const slidebars = [
  {
    text: 'Guide',
    children: [
      {
        text: 'Why Slidev',
        link: '/guide/why',
      },
      {
        text: 'Getting Started',
        link: '/guide/',
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
    ],
  },
  {
    text: 'Themes',
    children: [
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
    ],
  },
  {
    text: 'Customizations',
    children: [
      {
        text: 'Customizations',
        link: '/custom/',
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
    ],
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
      { text: 'Guide', link: '/guide/' },
      {
        text: 'Theme',
        items: [
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
        ],
      },
      { text: 'Customize', link: '/custom/' },
      { text: 'Showcases', link: '/showcases' },
    ],

    sidebar: {
      '/guide/': slidebars,
      '/themes/': slidebars,
      '/custom/': slidebars,
      '/': slidebars,
    },
  },
}
