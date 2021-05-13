export type Tag =
  | 'official'
  | 'dark'
  | 'light'
  | 'colorful'
  | 'minimalism'

export interface ThemeInfo {
  id: string
  name: string
  description: string
  previews: string[]
  repo?: string
  author: {
    name: string
    link?: string
  }
  link?: string
  tags?: Tag[]
}

export const official: ThemeInfo[] = [
  {
    id: '@slidev/theme-default',
    name: 'Default',
    description: 'The minimalism default theme for Slidev',
    author: {
      name: 'Anthony Fu',
      link: 'https://github.com/antfu',
    },
    repo: 'https://github.com/slidevjs/themes/tree/main/packages/theme-default',
    previews: [
      'https://github.com/slidevjs/themes/blob/main/screenshots/theme-default/01.png?raw=true',
      'https://github.com/slidevjs/themes/blob/main/screenshots/theme-default/02.png?raw=true',
      'https://github.com/slidevjs/themes/blob/main/screenshots/theme-default/06.png?raw=true',
      'https://github.com/slidevjs/themes/blob/main/screenshots/theme-default/08.png?raw=true',
    ],
    tags: [
      'official',
      'minimalism',
      'dark',
      'light',
    ],
  },
  {
    id: '@slidev/theme-seriph',
    name: 'Seriph',
    description: 'A more formal looking theme using Serif fonts',
    author: {
      name: 'Anthony Fu',
      link: 'https://github.com/antfu',
    },
    repo: 'https://github.com/slidevjs/themes/tree/main/packages/theme-seriph',
    previews: [
      'https://github.com/slidevjs/themes/blob/main/screenshots/theme-seriph/01.png?raw=true',
      'https://github.com/slidevjs/themes/blob/main/screenshots/theme-seriph/02.png?raw=true',
      'https://github.com/slidevjs/themes/blob/main/screenshots/theme-seriph/03.png?raw=true',
      'https://github.com/slidevjs/themes/blob/main/screenshots/theme-seriph/08.png?raw=true',
    ],
    tags: [
      'official',
      'minimalism',
      'dark',
      'light',
    ],
  },
  {
    id: '@slidev/theme-apple-basic',
    name: 'Apple Basic',
    description: 'Inspired by the Basic Black/White theme from Apple Keynote',
    author: {
      name: 'Jeremy Meissner',
      link: 'https://github.com/JeremyMeissner',
    },
    repo: 'https://github.com/slidevjs/themes/tree/main/packages/theme-apple-basic',
    previews: [
      'https://i.imgur.com/976e8Hu.png',
      'https://i.imgur.com/dE1r2bg.png',
      'https://i.imgur.com/gnB4oa8.png',
    ],
    tags: [
      'minimalism',
      'dark',
      'light',
    ],
  },
]

export const community: ThemeInfo[] = [
  {
    id: 'slidev-theme-flayyer',
    name: 'Flayyer',
    description: 'This theme is inspired by the layout of Flayyer and the way that it works.',
    author: {
      name: 'Daniel Esteves',
      link: 'https://github.com/danestves',
    },
    repo: 'https://github.com/danestves/slidev-theme-flayyer',
    previews: [
      'https://i.imgur.com/grKiGIK.png',
      'https://i.imgur.com/tAvcf5S.png',
      'https://i.imgur.com/mj42LcL.png',
      'https://i.imgur.com/41QWv3c.png',
    ],
    tags: [
      'flayyer',
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-geist',
    name: 'Vercel',
    description: 'A theme based on Vercel\'s design system.',
    author: {
      name: 'Nico Bachner',
      link: 'https://github.com/nico-bachner',
    },
    repo: 'https://github.com/nico-bachner/slidev-theme-geist',
    previews: [
      'https://github.com/nico-bachner/slidev-theme-geist/blob/main/example-export/01.png?raw=true',
      'https://github.com/nico-bachner/slidev-theme-geist/blob/main/example-export/02.png?raw=true',
      'https://github.com/nico-bachner/slidev-theme-geist/blob/main/example-export/03.png?raw=true',
      'https://github.com/nico-bachner/slidev-theme-geist/blob/main/example-export/04.png?raw=true',
      'https://github.com/nico-bachner/slidev-theme-geist/blob/main/example-export/05.png?raw=true',
    ],
    tags: [
      'vercel',
      'dark',
      'light',
    ],
  },
  // Add yours here!
  {
    id: '',
    link: 'https://github.com/slidevjs/slidev/edit/main/docs/.vitepress/themes.ts',
    name: 'Yours?',
    description: 'Submit your theme to be list here!',
    author: {
      name: '',
    },
    previews: [
      '/themes/placeholder.png',
    ],
  },
]
