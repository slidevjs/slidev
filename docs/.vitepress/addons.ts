import type { ThemeInfo } from './themes'

export type AddonInfo = Omit<ThemeInfo, 'previews'>

export const official: AddonInfo[] = [
  {
    id: '',
    link: '#',
    name: 'Work in Progress',
    description: '',
    tags: [],
    author: {
      name: '',
    },
  },
]

export const community: AddonInfo[] = [
  {
    id: 'slidev-addon-python-runner',
    name: 'Python Runner',
    description: 'Run actual Python code in your slides',
    tags: ['Code runner'],
    author: {
      name: '_Kerman',
      link: 'https://github.com/KermanX',
    },
    repo: 'https://github.com/KermanX/slidev-addon-python-runner',
  },
  {
    id: 'slidev-addon-tldraw',
    name: 'tldraw for Slidev',
    description: 'Embed tldraw diagrams directly in Slidev, with in-slide editing support',
    tags: ['Integration', 'Diagram'],
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
    tags: ['Remote control', 'Navigation'],
    author: {
      name: 'Tony Cabaye',
      link: 'https://github.com/tonai',
    },
    repo: 'https://github.com/Smile-SA/slidev-addon-sync',
  },
  {
    id: 'slidev-addon-tikzjax',
    name: 'slidev-addon-tikzjax',
    description: 'Compile TikZ/Chemfig/... to SVG and display them in Slidev',
    tags: ['Integration', 'Diagram'],
    author: {
      name: 'Ethan Goh',
      link: 'https://github.com/7086cmd',
    },
    repo: 'https://github.com/7086cmd/slidev-addon-tikzjax',
  },
  {
    id: 'slidev-component-pager',
    name: 'slidev-component-pager',
    description: 'Show current page and total page number',
    tags: ['Component', 'Navigation'],
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
    tags: ['Component'],
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
    tags: ['Tool', 'Navigation'],
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
    tags: ['Navigation'],
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
    tags: ['Tool'],
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
    tags: ['Tool'],
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
    tags: ['Tool', 'Navigation'],
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
    description: 'Click here to submit your addon :)',
    tags: [],
    author: {
      name: '',
    },
  },
]
