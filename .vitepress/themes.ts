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
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-light-icons',
    name: 'Light Icons',
    description: 'A simple, light and elegant theme for Slidev, combined together with creative layouts, custom components & fonts',
    author: {
      name: 'Pulkit Aggarwal',
      link: 'https://github.com/BashCloud',
    },
    repo: 'https://github.com/lightvue/slidev-theme-light-icons',
    previews: [
      'https://github.com/lightvue/slidev-theme-light-icons/blob/master/screenshot/1-layout-intro.png?raw=true',
      'https://github.com/lightvue/slidev-theme-light-icons/blob/master/screenshot/2-layout-image-header-intro-light.png?raw=true',
      'https://github.com/lightvue/slidev-theme-light-icons/blob/master/screenshot/3-layout-dynamic-image-light.png?raw=true',
      'https://github.com/lightvue/slidev-theme-light-icons/blob/master/screenshot/5-layout-dynamic-image-light.png?raw=true',
      'https://github.com/lightvue/slidev-theme-light-icons/blob/master/screenshot/7-layout-dynamic-image-light.png?raw=true',
      'https://github.com/lightvue/slidev-theme-light-icons/blob/master/screenshot/8-layout-center-image-light.png?raw=true',
      'https://github.com/lightvue/slidev-theme-light-icons/blob/master/screenshot/9-layout-dynamic-image-light.png?raw=true',
      'https://github.com/lightvue/slidev-theme-light-icons/blob/master/screenshot/10-layout-left-image-light.png?raw=true',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-purplin',
    name: 'Purplin',
    description: 'Theme with bar bottom component. Based on purple color',
    author: {
      name: 'Mauricio Martínez',
      link: 'https://github.com/moudev',
    },
    repo: 'https://github.com/moudev/slidev-theme-purplin',
    previews: [
      'https://i.imgur.com/BX3TpEc.png',
      'https://i.imgur.com/mqqRi1F.png',
      'https://i.imgur.com/fwm2785.png',
      'https://i.imgur.com/m8eemKt.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-unicorn',
    name: 'Unicorn',
    description: 'Based on Dawntraoz website design',
    author: {
      name: 'Alba Silvente (dawntraoz)',
      link: 'https://github.com/dawntraoz',
    },
    repo: 'https://github.com/dawntraoz/slidev-theme-unicorn',
    previews: [
      'https://raw.githubusercontent.com/Dawntraoz/slidev-theme-unicorn/master/screenshots/dark-theme-intro.png',
      'https://raw.githubusercontent.com/Dawntraoz/slidev-theme-unicorn/master/screenshots/light-theme-cover.png',
      'https://raw.githubusercontent.com/Dawntraoz/slidev-theme-unicorn/master/screenshots/dark-theme-image-centered.png',
      'https://raw.githubusercontent.com/Dawntraoz/slidev-theme-unicorn/master/screenshots/dark-theme-center-without-header-footer.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-zhozhoba',
    name: 'Zhozhoba',
    description: 'A zhozhoba theme for Slidev',
    author: {
      name: 'Bogenbai Bayzharassov',
      link: 'https://github.com/thatoranzhevyy',
    },
    repo: 'https://github.com/thatoranzhevyy/slidev-theme-zhozhoba',
    previews: [
      'https://github.com/thatoranzhevyy/slidev-theme-zhozhoba/blob/master/slides-export/01.png?raw=true',
      'https://github.com/thatoranzhevyy/slidev-theme-zhozhoba/blob/master/.github/dark.png?raw=true',
      'https://github.com/thatoranzhevyy/slidev-theme-zhozhoba/blob/master/slides-export/02.png?raw=true',
      'https://github.com/thatoranzhevyy/slidev-theme-zhozhoba/blob/master/slides-export/03.png?raw=true',
      'https://github.com/thatoranzhevyy/slidev-theme-zhozhoba/blob/master/slides-export/04.png?raw=true',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
   {
    id: 'slidev-theme-penguin',
    name: 'Penguin',
    description: 'A Penguin theme for Slidev',
    author: {
      name: 'Alvaro Saburido (alvarosaburido)',
      link: 'https://github.com/alvarosaburido',
    },
    repo: 'https://github.com/alvarosaburido/slidev-theme-penguin',
    previews: [
      'https://raw.githubusercontent.com/alvarosaburido/slidev-theme-penguin/master/screenshots/dark/01.png',
      'https://raw.githubusercontent.com/alvarosaburido/slidev-theme-penguin/master/screenshots/light/02.png',
      'https://raw.githubusercontent.com/alvarosaburido/slidev-theme-penguin/master/screenshots/light/06.png',
      'https://raw.githubusercontent.com/alvarosaburido/slidev-theme-penguin/master/screenshots/light/05.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  // Add yours here!
  {
    id: '',
    link: 'https://github.com/slidevjs/docs/edit/main/.vitepress/themes.ts',
    name: 'Yours?',
    description: 'Submit your theme to be list here!',
    author: {
      name: '',
    },
    previews: [
      '/theme-placeholder.png',
    ],
  },
]
