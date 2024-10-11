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
    id: 'slidev-addon-sync',
    name: 'slidev-addon-sync',
    description: 'Sync component for Slidev static build that uses a SSE or WS server',
    author: {
      name: 'Tony Cabaye',
      link: 'https://github.com/tonai',
    },
    repo: 'https://github.com/Smile-SA/slidev-addon-sync',
  },
  {
    id: 'slidev-component-pager',
    name: 'slidev-component-pager',
    description: 'Show current page and total page number',
    author: {
      name: 'Tony Cabaye',
      link: 'https://github.com/tonai',
    },
    repo: 'https://github.com/Smile-SA/slidev-component-pager',
  },
  {
    id: 'slidev-component-poll',
    name: 'slidev-component-poll',
    description: 'Poll and Quiz components for Slidev',
    author: {
      name: 'Tony Cabaye',
      link: 'https://github.com/tonai',
    },
    repo: 'https://github.com/Smile-SA/slidev-component-poll',
  },
  {
    id: 'slidev-component-progress',
    name: 'slidev-component-progress',
    description: 'Show interactive progress bar for Slidev',
    author: {
      name: 'Tony Cabaye',
      link: 'https://github.com/tonai',
    },
    repo: 'https://github.com/Smile-SA/slidev-component-progress',
  },
  {
    id: 'slidev-component-scroll',
    name: 'slidev-component-scroll',
    description: 'Use mouse wheel for navigating',
    author: {
      name: 'Tony Cabaye',
      link: 'https://github.com/tonai',
    },
    repo: 'https://github.com/Smile-SA/slidev-component-scroll',
  },
  {
    id: 'slidev-component-spotlight',
    name: 'slidev-component-spotlight',
    description: 'Activate a spotlight to highlight a specific region by holding a key',
    author: {
      name: 'Tony Cabaye',
      link: 'https://github.com/tonai',
    },
    repo: 'https://github.com/Smile-SA/slidev-component-spotlight',
  },
  {
    id: 'slidev-component-zoom',
    name: 'slidev-component-zoom',
    description: 'Allow zooming inside the slides',
    author: {
      name: 'Tony Cabaye',
      link: 'https://github.com/tonai',
    },
    repo: 'https://github.com/Smile-SA/slidev-component-zoom',
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
