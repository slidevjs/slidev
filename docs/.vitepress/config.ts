import type { DefaultTheme } from 'vitepress'
import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'

const CURRENT_VERSION = '0.48.0-beta.22'

const Guide: DefaultTheme.NavItemWithLink[] = [
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

const BuiltIn: DefaultTheme.NavItemWithLink[] = [
  {
    text: 'Components',
    link: '/builtin/components',
  },
  {
    text: 'Layouts',
    link: '/builtin/layouts',
  },
]

const Theme: (DefaultTheme.NavItemWithLink | DefaultTheme.NavItemChildren)[] = [
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

const Addon: DefaultTheme.NavItemWithLink[] = [
  {
    text: 'Use Addon',
    link: '/addons/use',
  },
  {
    text: 'Write an Addon',
    link: '/addons/write-an-addon',
  },
]

const Customizations: (DefaultTheme.NavItemWithLink | DefaultTheme.NavItemChildren)[] = [
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
    text: 'Configure UnoCSS',
    link: '/custom/config-unocss',
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
    text: 'Configure Parser',
    link: '/custom/config-parser',
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
  },
]

const Resources: DefaultTheme.NavItemWithLink[] = [
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

const slidebars: DefaultTheme.SidebarItem[] = [
  {
    text: 'Guide',
    items: Guide,
  },
  {
    text: 'Themes',
    items: Theme,
  },
  {
    text: 'Addons',
    items: Addon,
  },
  {
    text: 'Customizations',
    items: Customizations,
  },
  {
    text: 'Built-in',
    items: BuiltIn,
  },
  {
    text: 'Resources',
    items: Resources,
  },
]

export default defineConfig({
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
  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    async shikiSetup(shiki) {
      await shiki.loadLanguage(
        'html',
        'xml',
        'vue',
        'markdown',
      )
    },
    codeTransformers: [
      transformerTwoslash(),
    ],
  },
  cleanUrls: true,
  themeConfig: {
    logo: '/logo.svg',
    editLink: {
      pattern: 'https://github.com/slidevjs/docs/edit/main/:path',
      text: 'Suggest changes to this page',
    },

    search: {
      provider: 'local',
    },

    nav: [
      {
        text: 'Guide',
        items: Guide,
      },
      {
        text: 'Theme',
        items: [
          ...Theme,
          {
            text: 'Built-in',
            items: BuiltIn,
          },
        ],
      },
      {
        text: 'Customize',
        items: [
          ...Customizations,
          {
            text: 'Addon',
            items: Addon,
          },
        ],
      },
      {
        text: 'Resources',
        items: Resources,
      },
      {
        text: `v${CURRENT_VERSION}`,
        items: [
          { text: 'Release Notes', link: 'https://github.com/slidevjs/slidev/releases' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/slidevjs/slidev' },
      { icon: 'twitter', link: 'https://twitter.com/slidevjs' },
      { icon: 'discord', link: 'https://chat.sli.dev' },
    ],

    sidebar: {
      '/guide/': slidebars,
      '/themes/': slidebars,
      '/addons/': slidebars,
      '/custom/': slidebars,
      '/builtin/': slidebars,
      '/resources/': slidebars,
      '/': slidebars,
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2020 Anthony Fu.',
    },
  },

  locales: {
    root: {
      label: 'English',
    },
    zh: {
      label: '简体中文',
      link: 'https://cn.sli.dev/',
    },
    fr: {
      label: 'Français',
      link: 'https://fr.sli.dev/',
    },
    es: {
      label: 'Español',
      link: 'https://es.sli.dev/',
    },
    ru: {
      label: 'Русский',
      link: 'https://ru.sli.dev/',
    },
    vn: {
      label: 'Việt Nam',
      link: 'https://vn.sli.dev/',
    },
    de: {
      label: 'Deutsch',
      link: 'https://de.sli.dev/',
    },
    br: {
      label: 'Português (BR)',
      link: 'https://br.sli.dev/',
    },
    el: {
      label: 'Ελληνικά',
      link: 'https://el.sli.dev/',
    },
    ja: {
      label: '日本語',
      link: 'https://ja.sli.dev/',
    },
  },
})
