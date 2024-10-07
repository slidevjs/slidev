import type { ThemeInfo } from './themes'

export type AddonInfo = Omit<ThemeInfo, 'previews' | 'tags'>

export const official: AddonInfo[] = [
  {
    id: '',
    link: '#',
    name: 'Work in Progress',
    description: '',
    author: {
      name: '',
    },
  },
]

export const community: AddonInfo[] = [
  {
    id: 'slidev-addon-tldraw',
    name: 'tldraw for Slidev',
    description: 'Embed tldraw diagrams directly in Slidev, with in-slide editing support',
    author: {
      name: 'Albert Brand',
      link: 'https://github.com/AlbertBrand',
    },
    repo: 'https://github.com/AlbertBrand/slidev-addon-tldraw',
  },
  {
    id: 'slidev-addon-rabbit',
    name: 'slidev-addon-rabbit',
    description: 'Presentation time management for Slidev inspired by Rabbit',
    author: {
      name: 'kaakaa',
      link: 'https://github.com/kaakaa',
    },
    repo: 'https://github.com/kaakaa/slidev-addon-rabbit',
  },
  // Add yours here!
  {
    id: '',
    link: 'https://github.com/slidevjs/slidev/edit/main/docs/.vitepress/addons.ts',
    name: 'Yours?',
    description: 'Submit your addon to be list here!',
    author: {
      name: '',
    },
  },
]
