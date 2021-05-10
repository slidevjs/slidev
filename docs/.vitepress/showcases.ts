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
    title: 'Seongland',
    cover: `https://seongland.com/ogtag.png`,
    author: {
      name: 'Seonglae Cho',
      link: 'https://github.com/seonglae',
    },
    slidesLink: 'https://seonglae-slides.vercel.app',
    sourceLink: 'https://github.com/seonglae/seonglae-slides',
    at: 'Seongland',
    datetime: '2021-05-10',
  },
  // Add yours here!
  {
    title: 'Yours?',
    author: {
      name: '',
    },
    at: 'Submit your talk/presentation to be list here!',
    cover: `${import.meta.env.BASE_URL}themes/placeholder.png`,
    datetime: '2021-04-29',
  },
]
