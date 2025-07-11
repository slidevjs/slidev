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
  tags?: string[]
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
    id: 'slidev-theme-eloc',
    name: 'Eloc',
    description: 'Focus on writing, present in a concise style.',
    author: {
      name: 'Amio',
      link: 'https://github.com/amio',
    },
    repo: 'https://github.com/zthxxx/slides/tree/master/packages/slidev-theme-eloc',
    previews: [
      'https://cdn.jsdelivr.net/gh/zthxxx/slides@master/packages/slidev-theme-eloc/screenshot/01.png',
      'https://cdn.jsdelivr.net/gh/zthxxx/slides@master/packages/slidev-theme-eloc/screenshot/02.png',
      'https://cdn.jsdelivr.net/gh/zthxxx/slides@master/packages/slidev-theme-eloc/screenshot/03.png',
      'https://cdn.jsdelivr.net/gh/zthxxx/slides@master/packages/slidev-theme-eloc/screenshot/04.png',
      'https://cdn.jsdelivr.net/gh/zthxxx/slides@master/packages/slidev-theme-eloc/screenshot/05.png',
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
      name: 'Alba Silvente',
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
      name: 'Alvaro Saburido',
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
  {
    id: 'slidev-theme-academic',
    name: 'Academic',
    description: 'Academic presentations with Slidev made simple',
    author: {
      name: 'Alexander Eble',
      link: 'https://github.com/alexanderdavide',
    },
    repo: 'https://github.com/alexanderdavide/slidev-theme-academic',
    previews: [
      'https://cdn.jsdelivr.net/gh/alexanderdavide/slidev-theme-academic@assets/example-export/01.png',
      'https://cdn.jsdelivr.net/gh/alexanderdavide/slidev-theme-academic@assets/example-export/02.png',
      'https://cdn.jsdelivr.net/gh/alexanderdavide/slidev-theme-academic@assets/example-export/08.png',
      'https://cdn.jsdelivr.net/gh/alexanderdavide/slidev-theme-academic@assets/example-export/04.png',
      'https://cdn.jsdelivr.net/gh/alexanderdavide/slidev-theme-academic@assets/example-export/05.png',
      'https://cdn.jsdelivr.net/gh/alexanderdavide/slidev-theme-academic@assets/example-export/06.png',
      'https://cdn.jsdelivr.net/gh/alexanderdavide/slidev-theme-academic@assets/example-export/07.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-mokkapps',
    name: 'Mokkapps',
    description: 'A theme for my personal brand "Mokkapps"',
    author: {
      name: 'Michael Hoffmann',
      link: 'https://github.com/mokkapps',
    },
    repo: 'https://github.com/mokkapps/slidev-theme-mokkapps',
    previews: [
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/001.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/002.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/003.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/004.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/005.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/006.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/007.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/008.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/009.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/010.png',
      'https://cdn.jsdelivr.net/gh/mokkapps/slidev-theme-mokkapps@master/screenshots/dark/011.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-the-unnamed',
    name: 'The unnamed',
    description: 'A theme based on The unnamed VS Code theme',
    author: {
      name: 'Elio Struyf',
      link: 'https://elio.dev',
    },
    repo: 'https://github.com/estruyf/slidev-theme-the-unnamed',
    previews: [
      'https://cdn.jsdelivr.net/gh/estruyf/slidev-theme-the-unnamed@main/assets/cover.png',
      'https://cdn.jsdelivr.net/gh/estruyf/slidev-theme-the-unnamed@main/assets/about-me.png',
      'https://cdn.jsdelivr.net/gh/estruyf/slidev-theme-the-unnamed@main/assets/default.png',
      'https://cdn.jsdelivr.net/gh/estruyf/slidev-theme-the-unnamed@main/assets/section.png',
    ],
    tags: [
      'dark',
    ],
  },
  {
    id: 'slidev-theme-dracula',
    name: 'Dracula',
    description: 'One the best dark theme meets slidev',
    author: {
      name: 'JD Solanki',
      link: 'https://github.com/jd-solanki',
    },
    repo: 'https://github.com/jd-solanki/slidev-theme-dracula',
    previews: [
      'https://cdn.jsdelivr.net/gh/jd-solanki/slidev-theme-dracula/screenshots/screenshot-1.png',
      'https://cdn.jsdelivr.net/gh/jd-solanki/slidev-theme-dracula/screenshots/screenshot-2.png',
      'https://cdn.jsdelivr.net/gh/jd-solanki/slidev-theme-dracula/screenshots/screenshot-3.png',
      'https://cdn.jsdelivr.net/gh/jd-solanki/slidev-theme-dracula/screenshots/screenshot-4.png',
      'https://cdn.jsdelivr.net/gh/jd-solanki/slidev-theme-dracula/screenshots/screenshot-5.png',
    ],
    tags: [
      'dark',
      'minimalism',
    ],
  },
  {
    id: 'slidev-theme-frankfurt',
    name: 'Frankfurt',
    description: 'Inspired by the Beamer theme Frankfurt',
    author: {
      name: 'Mu-Tsun Tsai',
      link: 'https://github.com/MuTsunTsai',
    },
    repo: 'https://github.com/MuTsunTsai/slidev-theme-frankfurt',
    previews: [
      'https://cdn.jsdelivr.net/gh/MuTsunTsai/slidev-theme-frankfurt/screenshots/01.png',
      'https://cdn.jsdelivr.net/gh/MuTsunTsai/slidev-theme-frankfurt/screenshots/04.png',
      'https://cdn.jsdelivr.net/gh/MuTsunTsai/slidev-theme-frankfurt/screenshots/06.png',
      'https://cdn.jsdelivr.net/gh/MuTsunTsai/slidev-theme-frankfurt/screenshots/07.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-hep',
    name: 'HEP',
    description: 'Academic style for High Energy Physics',
    author: {
      name: 'Yulei ZHANG',
      link: 'https://github.com/AvencastF',
    },
    repo: 'https://github.com/AvencastF/slidev-theme-hep',
    previews: [
      'https://cdn.jsdelivr.net/gh/avencastf/slidev-theme-hep/screenshot/001.png',
      'https://cdn.jsdelivr.net/gh/avencastf/slidev-theme-hep/screenshot/004.png',
      'https://cdn.jsdelivr.net/gh/avencastf/slidev-theme-hep/screenshot/006.png',
      'https://cdn.jsdelivr.net/gh/avencastf/slidev-theme-hep/screenshot/008.png',
    ],
    tags: [
      'light',
    ],
  },
  {
    id: 'slidev-theme-excali-slide',
    name: 'Excali-slide',
    description: 'A theme based on Excalidraw with animated highlighter effect',
    author: {
      name: 'Filip Hric',
      link: 'https://github.com/filiphric',
    },
    repo: 'https://github.com/filiphric/slidev-theme-excali-slide',
    previews: [
      'https://raw.githubusercontent.com/filiphric/excali-slide/main/images/default_slide.png',
      'https://raw.githubusercontent.com/filiphric/excali-slide/main/images/intro_slide.png',
    ],
    tags: [
      'dark',
      'light',
    ],
  },
  {
    id: 'slidev-theme-mint',
    name: 'mint',
    description: 'Slidev Theme Mint',
    author: {
      name: 'Alfatta Rezqa',
      link: 'https://github.com/alfatta',
    },
    repo: 'https://github.com/alfatta/slidev-theme-mint',
    previews: [
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/1.png',
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/2.png',
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/3.png',
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/4.png',
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/5.png',
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/6.png',
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/7.png',
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/8.png',
      'https://cdn.jsdelivr.net/gh/alfatta/slidev-theme-mint/screenshot/9.png',
    ],
    tags: [
      'light',
      'mint',
      'green',
      'cool',
    ],
  },
  {
    id: 'slidev-theme-neversink',
    name: 'neversink',
    description: 'Slidev Theme Neversink',
    author: {
      name: 'Todd M. Gureckis',
      link: 'https://github.com/gureckis',
    },
    repo: 'https://github.com/gureckis/slidev-theme-neversink',
    previews: [
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/2.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/6.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/8.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/15.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/18.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/22.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/26.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/34.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/36.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/38.png',
      'https://gureckis.github.io/slidev-theme-neversink/screenshots/35.png',
    ],
    tags: [
      'light',
      'academic',
      'education',
    ],
  },
  {
    id: 'slidev-theme-ktym4a',
    name: 'ktym4a',
    description: 'Based on ktym4a website design',
    author: {
      name: 'ktym4a',
      link: 'https://github.com/ktym4a',
    },
    repo: 'https://github.com/ktym4a/slidev-theme-ktym4a',
    previews: [
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/rotation/0.png',
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/rotation/1.png',
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/rotation/6.png',
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/rotation/7.png',
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/rotation/8.png',
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/single/0.png',
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/single/1.png',
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/single/3.png',
      'https://cdn.jsdelivr.net/gh/ktym4a/slidev-theme-ktym4a@main/example-export/single/4.png',
    ],
    tags: [
      'dark',
      'catppuccin',
    ],
  },
  // Add yours here!
  {
    id: '',
    link: 'https://github.com/slidevjs/slidev/edit/main/docs/.vitepress/themes.ts',
    name: 'Yours?',
    description: 'Click here to submit your theme :)',
    author: {
      name: '',
    },
    previews: [
      '/theme-placeholder.png',
    ],
  },
]
