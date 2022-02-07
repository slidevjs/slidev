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
    text: 'Navigation',
    link: '/guide/navigation',
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
    text: 'Static Hosting',
    link: '/guide/hosting',
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
    text: 'Drawing & Annotations',
    link: '/guide/drawing',
  },
  {
    text: 'Editor Integrations',
    link: '/guide/editors',
  },
  {
    text: 'FAQ',
    link: '/guide/faq',
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

const Translations = [
  {
    text: 'English',
  },
  {
    text: '简体中文',
    link: 'https://cn.sli.dev{{pathname}}',
  },
  {
    text: 'Français',
    link: 'https://fr.sli.dev{{pathname}}',
  },
  {
    text: 'Español',
    link: 'https://es.sli.dev{{pathname}}',
  },
  {
    text: 'Русский',
    link: 'https://ru.sli.dev{{pathname}}',
  },
  {
    text: 'Việt Nam',
    link: 'https://vn.sli.dev{{pathname}}',
  },
  {
    text: 'Deutsch',
    link: 'https://de.sli.dev{{pathname}}',
  },
  {
    text: 'Português (BR)',
    link: 'https://br.sli.dev{{pathname}}',
  },
  {
    text: 'Ελληνικά',
    link: 'https://el.sli.dev{{pathname}}',
  },
  {
    text: '日本語',
    link: 'https://ja.sli.dev{{pathname}}',
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
    text: 'Fonts',
    link: '/custom/fonts',
  },
  {
    text: 'Highlighters',
    link: '/custom/highlighters',
  },
  {
    text: 'Configure Vue',
    link: '/custom/config-vue',
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
  {
    text: 'Configure KaTeX',
    link: '/custom/config-katex',
  },
  {
    text: 'Configure Mermaid',
    link: '/custom/config-mermaid',
  },
  {
    text: 'Configure Shortcuts',
    link: '/custom/config-shortcuts',
  },
  {
    text: 'Vue Global Context',
    link: '/custom/vue-context',
  },
  {
    text: 'Global Layers',
    link: '/custom/global-layers',
  }
]

const Resources = [
  {
    text: 'Showcases',
    link: '/showcases',
  },
  {
    text: 'Learning Resources',
    link: '/resources/learning',
  },
  {
    text: 'Curated Covers',
    link: '/resources/covers',
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
    ['meta', { name: 'author', content: 'Anthony Fu' }],
    ['meta', { property: 'og:title', content: 'Slidev' }],
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
    repo: 'slidevjs/docs',
    logo: '/logo.svg',
    docsBranch: 'main',
    editLinks: true,
    editLinkText: 'Suggest changes to this page',

    algolia: {
      apiKey: '1a5c5a504139c58f428974c78c55291d',
      indexName: 'slidev',
      searchParameters: {
        // for translations maintainers: change the filter to your locale code (subdomain name)
        facetFilters: ['language:en']
      }
    },

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
      {
        text: 'Resources',
        items: Resources,
      },
      {
        text: 'English',
        items: Translations,
      },
    ],

    sidebar: {
      '/guide/': slidebars,
      '/themes/': slidebars,
      '/custom/': slidebars,
      '/builtin/': slidebars,
      '/resources/': slidebars,
      '/': slidebars,
    },
  },
}
