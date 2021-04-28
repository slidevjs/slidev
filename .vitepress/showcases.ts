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
    cover: '',
    author: {
      name: 'Anthony Fu',
      link: 'https://github.com/antfu',
    },
    slidesLink: 'https://slidev.antfu.me/demo/composable-vue',
    sourceLink: 'https://github.com/antfu/talks/tree/master/2021-04-29',
    at: 'VueDay 2021',
    datetime: '2021-04-29',
  },
]
