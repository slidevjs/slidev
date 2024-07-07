import type { DefaultTheme } from 'vitepress'
import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { version } from '../../package.json'
import Guide from './guides'
import Customizations from './customizations'

const BuiltIn: DefaultTheme.NavItemWithLink[] = [
  {
    text: 'CLI',
    link: '/builtin/cli',
  },
  {
    text: 'Components',
    link: '/builtin/components',
  },
  {
    text: 'Layouts',
    link: '/builtin/layouts',
  },
]

const Advanced: DefaultTheme.NavItemWithLink[] = [
  {
    text: 'Global Context',
    link: '/guide/global-context',
  },
  {
    text: 'Write a Layout',
    link: '/guide/write-layout',
  },
  {
    text: 'Write a Theme',
    link: '/guide/write-theme',
  },
  {
    text: 'Write an Addon',
    link: '/guide/write-addon',
  },
]

const Resources: DefaultTheme.NavItemWithLink[] = [
  {
    text: 'Showcases',
    link: '/resources/showcases',
  },
  {
    text: 'Theme Gallery',
    link: '/resources/theme-gallery',
  },
  {
    text: 'Addon Gallery',
    link: '/resources/addon-gallery',
  },
  {
    text: 'Learning Resources',
    link: '/resources/learning',
  },
  {
    text: 'Curated Covers',
    link: '/resources/covers',
  },
  {
    text: 'Release Notes',
    link: 'https://github.com/slidevjs/slidev/releases',
  },
]

const slidebars: DefaultTheme.SidebarItem[] = [
  {
    text: 'Guide',
    items: Guide,
  },
  {
    text: 'Advanced',
    items: Advanced,
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
      pattern: 'https://github.com/slidevjs/slidev/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    search: {
      provider: 'local',
    },

    nav: [
      {
        text: 'Guide',
        items: [
          ...Guide,
          {
            text: 'Advanced',
            items: Advanced,
          },
        ],
      },
      {
        text: 'Reference',
        items: [
          {
            text: '✨ Features',
            link: '/features/',
          },
          {
            text: 'Built-in',
            items: BuiltIn,
          },
          {
            text: 'Customize',
            items: Customizations,
          },
        ],
      },
      {
        text: 'Resources',
        items: Resources,
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/slidevjs/slidev' },
      { icon: 'twitter', link: 'https://twitter.com/slidevjs' },
      { icon: 'discord', link: 'https://chat.sli.dev' },
    ],

    sidebar: {
      '/features/': [],
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
      copyright: 'Copyright © 2020-2024 Anthony Fu.',
    },
  },

  locales: {
    root: {
      label: `English (v${version})`,
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
