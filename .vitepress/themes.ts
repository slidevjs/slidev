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
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-default/01.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-default/02.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-default/06.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-default/08.png',
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
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-seriph/01.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-seriph/02.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-seriph/03.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-seriph/08.png',
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
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-apple-basic/01.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-apple-basic/02.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-apple-basic/03.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-apple-basic/09.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-apple-basic/11.png',
    ],
    tags: [
      'minimalism',
      'dark',
      'light',
    ],
  },
  {
    id: '@slidev/theme-bricks',
    name: 'Bricks',
    description: 'Building bricks',
    author: {
      name: 'iiiiiiinès',
      link: 'https://github.com/iiiiiiines',
    },
    repo: 'https://github.com/slidevjs/themes/tree/main/packages/theme-bricks',
    previews: [
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-bricks/01.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-bricks/04.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-bricks/06.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-bricks/05.png',
    ],
    tags: [
      'light',
    ],
  },
  {
    id: '@slidev/theme-shibainu',
    name: 'Shibainu',
    description: 'Meow!',
    author: {
      name: 'iiiiiiinès',
      link: 'https://github.com/iiiiiiines',
    },
    repo: 'https://github.com/slidevjs/themes/tree/main/packages/theme-shibainu',
    previews: [
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-shibainu/01.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-shibainu/03.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-shibainu/04.png',
      'https://cdn.jsdelivr.net/gh/slidevjs/themes@main/screenshots/theme-shibainu/09.png',
    ],
    tags: [
      'dark',
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
      'https://cdn.jsdelivr.net/gh/nico-bachner/slidev-theme-geist@main/example-export/01.png',
      'https://cdn.jsdelivr.net/gh/nico-bachner/slidev-theme-geist@main/example-export/02.png',
      'https://cdn.jsdelivr.net/gh/nico-bachner/slidev-theme-geist@main/example-export/03.png',
      'https://cdn.jsdelivr.net/gh/nico-bachner/slidev-theme-geist@main/example-export/04.png',
      'https://cdn.jsdelivr.net/gh/nico-bachner/slidev-theme-geist@main/example-export/05.png',
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
      'https://cdn.jsdelivr.net/gh/lightvue/slidev-theme-light-icons@master/screenshot/1-layout-intro.png',
      'https://cdn.jsdelivr.net/gh/lightvue/slidev-theme-light-icons@master/screenshot/2-layout-image-header-intro-light.png',
      'https://cdn.jsdelivr.net/gh/lightvue/slidev-theme-light-icons@master/screenshot/3-layout-dynamic-image-light.png',
      'https://cdn.jsdelivr.net/gh/lightvue/slidev-theme-light-icons@master/screenshot/5-layout-dynamic-image-light.png',
      'https://cdn.jsdelivr.net/gh/lightvue/slidev-theme-light-icons@master/screenshot/7-layout-dynamic-image-light.png',
      'https://cdn.jsdelivr.net/gh/lightvue/slidev-theme-light-icons@master/screenshot/8-layout-center-image-light.png',
      'https://cdn.jsdelivr.net/gh/lightvue/slidev-theme-light-icons@master/screenshot/9-layout-dynamic-image-light.png',
      'https://cdn.jsdelivr.net/gh/lightvue/slidev-theme-light-icons@master/screenshot/10-layout-left-image-light.png',
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
      'https://cdn.jsdelivr.net/gh/Dawntraoz/slidev-theme-unicorn@master/screenshots/dark-theme-intro.png',
      'https://cdn.jsdelivr.net/gh/Dawntraoz/slidev-theme-unicorn@master/screenshots/light-theme-cover.png',
      'https://cdn.jsdelivr.net/gh/Dawntraoz/slidev-theme-unicorn@master/screenshots/dark-theme-image-centered.png',
      'https://cdn.jsdelivr.net/gh/Dawntraoz/slidev-theme-unicorn@master/screenshots/dark-theme-center-without-header-footer.png',
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
      'https://cdn.jsdelivr.net/gh/thatoranzhevyy/slidev-theme-zhozhoba@master/slides-export/01.png',
      'https://cdn.jsdelivr.net/gh/thatoranzhevyy/slidev-theme-zhozhoba@master/.github/dark.png',
      'https://cdn.jsdelivr.net/gh/thatoranzhevyy/slidev-theme-zhozhoba@master/slides-export/02.png',
      'https://cdn.jsdelivr.net/gh/thatoranzhevyy/slidev-theme-zhozhoba@master/slides-export/03.png',
      'https://cdn.jsdelivr.net/gh/thatoranzhevyy/slidev-theme-zhozhoba@master/slides-export/04.png',
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
      'https://cdn.jsdelivr.net/gh/alvarosaburido/slidev-theme-penguin@master/screenshots/dark/01.png',
      'https://cdn.jsdelivr.net/gh/alvarosaburido/slidev-theme-penguin@master/screenshots/light/02.png',
      'https://cdn.jsdelivr.net/gh/alvarosaburido/slidev-theme-penguin@master/screenshots/light/06.png',
      'https://cdn.jsdelivr.net/gh/alvarosaburido/slidev-theme-penguin@master/screenshots/light/05.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-vuetiful',
    name: 'Vuetiful',
    description: 'A Vue-inspired theme for Slidev',
    author: {
      name: 'Thorsten Lünborg',
      link: 'https://github.com/LinusBorg',
    },
    repo: 'https://github.com/LinusBorg/slidev-theme-vuetiful',
    previews: [
      'https://cdn.jsdelivr.net/gh/LinusBorg/slidev-theme-vuetiful@main/screenshots/cover-alt.png',
      'https://cdn.jsdelivr.net/gh/LinusBorg/slidev-theme-vuetiful@main/screenshots/section.png',
      'https://cdn.jsdelivr.net/gh/LinusBorg/slidev-theme-vuetiful@main/screenshots/big-points.png',
      'https://cdn.jsdelivr.net/gh/LinusBorg/slidev-theme-vuetiful@main/screenshots/quote.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-takahashi',
    name: 'Takahashi',
    description: 'A simple theme for Slidev',
    author: {
      name: 'Percy M.',
      link: 'https://github.com/kecrily',
    },
    repo: 'https://github.com/kecrily/slidev-theme-takahashi',
    previews: [
      'https://cdn.jsdelivr.net/gh/kecrily/slidev-theme-takahashi@master/screenshots/01.png',
      'https://cdn.jsdelivr.net/gh/kecrily/slidev-theme-takahashi@master/screenshots/02.png',
      'https://cdn.jsdelivr.net/gh/kecrily/slidev-theme-takahashi@master/screenshots/03.png',
      'https://cdn.jsdelivr.net/gh/kecrily/slidev-theme-takahashi@master/screenshots/04.png',
      'https://cdn.jsdelivr.net/gh/kecrily/slidev-theme-takahashi@master/screenshots/05.png',
      'https://cdn.jsdelivr.net/gh/kecrily/slidev-theme-takahashi@master/screenshots/06.png',
      'https://cdn.jsdelivr.net/gh/kecrily/slidev-theme-takahashi@master/screenshots/07.png',
    ],
    tags: [
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
