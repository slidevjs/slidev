export interface ShowCaseInfo {
  title: string
  cover: string
  slidesLink?: string
  sourceLink?: string
  videoLink?: string
  at?: string
  datetime: string
  author: {
    name: string
    link?: string
  }
}

export const showcases: ShowCaseInfo[] = [
  {
    title: 'Composable Vue',
    cover: `${import.meta.env.BASE_URL}showcases/composable-vue.png`,
    author: {
      name: 'Anthony Fu',
      link: 'https://github.com/antfu',
    },
    slidesLink: 'https://sli.dev/demo/composable-vue',
    sourceLink: 'https://github.com/antfu/talks/tree/master/2021-04-29',
    at: 'VueDay 2021',
    datetime: '2021-04-29',
  },
  {
    title: 'Developer Seonglae',
    cover: 'https://seonglae-slides.vercel.app/og.png',
    author: {
      name: 'Seonglae Cho',
      link: 'https://github.com/seonglae',
    },
    slidesLink: 'https://seonglae-slides.vercel.app',
    sourceLink: 'https://github.com/seonglae/seonglae-slides',
    at: 'Seongland',
    datetime: '2021-05-10',
  },
  {
    title: 'Vue 3 > Vue 2 + 1',
    cover: 'https://user-images.githubusercontent.com/11247099/122246420-1df97b80-cef9-11eb-9c57-7751c6999deb.png',
    author: {
      name: 'Thorsten Lünborg',
      link: 'https://github.com/LinusBorg',
    },
    slidesLink: 'http://vueday-2021.linusb.org',
    sourceLink: 'https://github.com/LinusBorg/vueday-enterjs-vue3',
    at: 'Enter.js Vue Day',
    datetime: '2021-06-15',
  },
  {
    title: 'Simply Publish Your Package to npm',
    author: {
      name: 'Lucky Dewa Satria',
      link: 'https://github.com/lucky401',
    },
    at: 'Weekly sharing',
    slidesLink: 'https://masukin.link/talks/simply-publish-your-package-to-npm',
    cover: 'https://masukin.link/talks-cover-npm.png',
    datetime: '2021-06-12',
  },
  {
    title: 'Create Icon Package With Vue and Rollup',
    author: {
      name: 'Lucky Dewa Satria',
      link: 'https://github.com/lucky401',
    },
    at: 'Weekly Sharing',
    slidesLink: 'https://masukin.link/talks/create-icon-package-with-vue-and-rollup',
    sourceLink: 'https://github.com/lucky401/Create-Icon-Package-With-Vue-and-Rollup',
    cover: 'https://masukin.link/talks-cover-create-icon-package-with-vue-and-rollup.png',
    datetime: '2021-06-19',
  },
  {
    title: 'BeAPT',
    author: {
      name: 'Daniel Sousa @TutoDS',
      link: 'https://github.com/tutods',
    },
    at: 'Presentation of my college final project',
    slidesLink: 'https://beapt-presentation.netlify.app',
    sourceLink: 'https://github.com/TutoDS/lei-project/tree/master/presentation',
    cover: 'https://raw.githubusercontent.com/TutoDS/lei-project/master/presentation/cover.png',
    datetime: '2021-07-20',
  },
  {
    title: 'Prisma as my ORM for PostgreSQL',
    cover: 'https://raw.githubusercontent.com/cedric25/prisma-talk/main/cover-for-slidev.png',
    author: {
      name: 'Cedric Nicoloso',
      link: 'https://github.com/cedric25',
    },
    slidesLink: 'https://prisma-talk.netlify.app/',
    sourceLink: 'https://github.com/cedric25/prisma-talk',
    at: 'LyonJS Meetup',
    datetime: '2021-07-21',
  },
  {
    title: 'Introduction to SVG',
    cover: 'https://raw.githubusercontent.com/lyqht/intro-to-svg-slides/main/intro-to-svg-slides-cover.png',
    author: {
      name: 'Estee Tey',
      link: 'https://github.com/lyqht',
    },
    slidesLink: 'https://lyqht.github.io/intro-to-svg-slides/',
    sourceLink: 'https://github.com/lyqht/intro-to-svg-slides',
    at: 'Thoughtworks Internal Lunch & Learn',
    datetime: '2021-11-12',
  },
  {
    title: 'Git\'s Most Wanted',
    cover: 'https://cdn.jsdelivr.net/gh/alexanderdavide/git-most-wanted@assets/slides-export/01.png',
    author: {
      name: 'Alexander Eble',
      link: 'https://github.com/alexanderdavide',
    },
    slidesLink: 'https://git-most-wanted.alex-eble.de',
    sourceLink: 'https://github.com/alexanderdavide/git-most-wanted',
    at: 'Internal Tech Talk',
    datetime: '2022-03-11',
  },
  // Add yours here!
  {
    title: 'Yours?',
    author: {
      name: '',
    },
    at: 'Submit your talk/presentation to be list here!',
    slidesLink: 'https://github.com/slidevjs/docs/edit/main/.vitepress/showcases.ts',
    cover: `${import.meta.env.BASE_URL}theme-placeholder.png`,
    datetime: '2021-04-29',
  },
]
