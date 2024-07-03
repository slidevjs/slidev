import type { ThemeInfo } from './themes'

export type AddonInfo = Omit<ThemeInfo, 'previews' | 'tags'>

export const official: AddonInfo[] = [
  {
    id: '',
    link: '#',
    name: 'TBD',
    description: 'TBD',
    author: {
      name: 'TBD',
    },
  },
]

export const community: AddonInfo[] = [
  // Add yours here!
  {
    id: '',
    link: 'https://github.com/slidevjs/docs/edit/main/.vitepress/addons.ts',
    name: 'Yours?',
    description: 'Submit your addon to be list here!',
    author: {
      name: '',
    },
  },
]
