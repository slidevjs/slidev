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
    repo: 'https://github.com/slidevjs/slidev/tree/main/packages/theme-default',
    previews: [
      '/themes/default.png',
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
    repo: 'https://github.com/slidevjs/slidev/tree/main/packages/theme-seriph',
    previews: [
      '/themes/seriph.png',
    ],
    tags: [
      'official',
      'minimalism',
      'dark',
      'light',
    ],
  },
]

export const community: ThemeInfo[] = [
  {
    id: 'slidev-theme-apple-basic',
    name: 'Apple Basic',
    description: 'Inspired by the Basic Black/White theme from Apple Keynote',
    author: {
      name: 'Jeremy Meissner',
      link: 'https://github.com/JeremyMeissner',
    },
    repo: 'https://github.com/JeremyMeissner/slidev-theme-apple-basic',
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
