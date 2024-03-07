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
    slidesLink: 'https://talks.antfu.me/2021/composable-vue/',
    sourceLink: 'https://github.com/antfu/talks/tree/main/2021-04-29',
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
  // {
  //   title: 'Simply Publish Your Package to npm',
  //   author: {
  //     name: 'Lucky Dewa Satria',
  //     link: 'https://github.com/lucky401',
  //   },
  //   at: 'Weekly sharing',
  //   slidesLink: 'https://masukin.link/talks/simply-publish-your-package-to-npm',
  //   cover: 'https://masukin.link/talks-cover-npm.png',
  //   datetime: '2021-06-12',
  // },
  // {
  //   title: 'Create Icon Package With Vue and Rollup',
  //   author: {
  //     name: 'Lucky Dewa Satria',
  //     link: 'https://github.com/lucky401',
  //   },
  //   at: 'Weekly Sharing',
  //   slidesLink: 'https://masukin.link/talks/create-icon-package-with-vue-and-rollup',
  //   sourceLink: 'https://github.com/lucky401/Create-Icon-Package-With-Vue-and-Rollup',
  //   cover: 'https://masukin.link/talks-cover-create-icon-package-with-vue-and-rollup.png',
  //   datetime: '2021-06-19',
  // },
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
    slidesLink: 'https://alexeble.de/talks/git-most-wanted/',
    sourceLink: 'https://github.com/alexanderdavide/git-most-wanted',
    at: 'Internal Tech Talk',
    datetime: '2022-03-11',
  },
  {
    title: 'OpenFunction 202',
    cover: 'https://s2.loli.net/2022/05/22/4zsCnkQRFoAU1E5.png',
    author: {
      name: 'Haili Zhang',
      link: 'https://github.com/webup',
    },
    slidesLink: 'https://openfunction-talks.netlify.app/2022/202-node-async/',
    sourceLink: 'https://github.com/webup/openfunction-talks/tree/main/202-node-async',
    at: 'OpenFunction Tutorial Sharing',
    datetime: '2022-05-08',
  },
  {
    title: 'Is it Okay to Pursue Functional Programming on Frontend?',
    author: {
      name: 'Minsu Kim , Changhui Lee',
    },
    at: '2022 JSConf Korea',
    slidesLink: 'https://moonlit-nougat-422445.netlify.app/1',
    sourceLink: 'https://github.com/alstn2468/2022-jsconf-presentation',
    cover: 'https://raw.githubusercontent.com/alstn2468/2022-jsconf-presentation/main/public/images/og.png',
    datetime: '2022-09-16',
  },
  {
    title: 'Blazing slidev ppt template with naive-ui',
    author: {
      name: 'godkun',
    },
    at: 'personal sharing',
    slidesLink: 'https://ppt.godkun.top',
    sourceLink: 'https://github.com/godkun/ppt-template',
    cover: 'https://github.com/godkun/ppt-template/raw/main/public/show.gif',
    datetime: '2022-10-24',
  },
  {
    title: 'Building a Polite Popup with Nuxt 3',
    author: {
      name: 'Michael Hoffmann',
      link: 'https://github.com/mokkapps',
    },
    at: 'Vue.js Nation 2023',
    slidesLink: 'https://vuejsnation-2023-talk-polite-popup.netlify.app',
    sourceLink: 'https://github.com/Mokkapps/vuejsnation-2023-lightning-talk-polite-popup-nuxt-3-slides',
    cover: 'https://raw.githubusercontent.com/Mokkapps/vuejsnation-2023-lightning-talk-polite-popup-nuxt-3-slides/main/screenshots/001.png',
    datetime: '2023-01-25',
  },
  {
    title: 'Dev Environment as Code',
    cover: 'https://cdn.jsdelivr.net/gh/alexanderdavide/dev-environment-as-code@assets/slides-export/001.png',
    author: {
      name: 'Alexander Eble',
      link: 'https://github.com/alexanderdavide',
    },
    slidesLink: 'https://alexeble.de/talks/dev-environment-as-code/',
    sourceLink: 'https://github.com/alexanderdavide/dev-environment-as-code',
    at: 'Internal Tech Talk',
    datetime: '2022-12-01',
  },
  {
    title: 'Exploring Social Engineering',
    cover: 'https://raw.githubusercontent.com/zyf722/exploring-social-engineering-slides/main/assets/Screenshot_Cover.png',
    author: {
      name: 'zyf722',
      link: 'https://github.com/zyf722',
    },
    slidesLink: 'https://zyf722.github.io/exploring-social-engineering-slides/',
    sourceLink: 'https://github.com/zyf722/exploring-social-engineering-slides',
    at: 'Presentation on Social Engineering in Computers in Society class',
    datetime: '2023-10-20',
  },
  {
    title: 'Diablo Health Orb Shader',
    author: {
      name: 'SuneBear',
      link: 'https://github.com/sunebear',
    },
    at: 'rctAI Sessions',
    slidesLink: 'https://rct-ai.github.io/frontend-slides/diablo-health-orb-shader/',
    sourceLink: 'https://github.com/rct-ai/frontend-slides',
    cover: 'https://github-production-user-asset-6210df.s3.amazonaws.com/7693264/284304324-db973b4c-a043-4644-932c-826169a1b4d8.gif',
    datetime: '2022-09-01',
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
    datetime: '2020-1-1',
  },
].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
