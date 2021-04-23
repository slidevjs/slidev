// @ts-check

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
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:wght@200;400;500;600', rel: 'stylesheet' }],
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

    sidebar: {
      '/guide/': [
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
              text: 'Slides Syntax',
              link: '/guide/syntax',
            },
            {
              text: 'Animations',
              link: '/guide/animations',
            },
            {
              text: 'Export to PDF',
              link: '/guide/export',
            },
            {
              text: 'Record Presentation',
              link: '/guide/record',
            },
          ],
        },
        {
          text: 'Themes',
          children: [
            {
              text: 'Use a Theme',
              link: '/guide/use-a-theme',
            },
            {
              text: 'Theme Gallery',
              link: '/guide/theme-gallery',
            },
            {
              text: 'Write a Theme',
              link: '/guide/write-a-theme',
            },
          ],
        },
        {
          text: 'Customizations',
          children: [
            {
              text: 'Customization',
              link: '/guide/config',
            },
            {
              text: 'Use Components',
              link: '/guide/components',
            },
            {
              text: 'Directory Structure',
              link: '/guide/structure',
            },
            {
              text: 'Configure Vite',
              link: '/guide/config-vite',
            },
            {
              text: 'Configure WindiCSS',
              link: '/guide/config-windicss',
            },
          ],
        },
      ],
    },
  },
}
