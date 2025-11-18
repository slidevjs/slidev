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
  {
    title: 'Comparison of Packaging Tools in 2023',
    author: {
      name: 'Peacock (Yoichi Takai)',
      link: 'https://p3ac0ck.net',
    },
    at: 'PyCon APAC 2023',
    slidesLink: 'https://slides.p3ac0ck.net/pyconapac2023/1',
    sourceLink: 'https://github.com/peacock0803sz/slidev-slides/blob/7d41aa5e89ad8627cb68ae2cdbfe1681017b0408/talks/pyconapac2023/pyconapac2023.md',
    cover: 'https://slides.p3ac0ck.net/pyconapac2023/cover.png',
    datetime: '2023-10-28',
  },
  {
    title: 'How Rust error handling ease web development',
    author: {
      name: 'Nguyễn Hồng Quân',
      link: 'https://quan.hoabinh.vn',
    },
    at: 'FOSSASIA Summit 2024',
    slidesLink: 'https://talk.quan.hoabinh.vn/rust-error-handling-ease-web-dev/',
    sourceLink: 'https://hongquan@bitbucket.org/hongquan/rust-error-handling-ease-web-dev',
    cover: 'https://i.imgur.com/2eBJofY.png',
    datetime: '2024-04-10',
  },
  {
    title: 'Sit Back and Relax with Fault Awareness and Robust Instant Recovery for Large Scale AI Workloads',
    author: {
      name: 'Neko',
      link: 'https://github.com/nekomeowww',
    },
    at: 'KubeCon 2024 China',
    slidesLink: 'https://talks.ayaka.io/nekoayaka/2024-08-21-kubecon-hk/',
    sourceLink: 'https://github.com/nekomeowww/talks/tree/main/packages/2024-08-21-kubecon-hk',
    cover: 'https://raw.githubusercontent.com/BaizeAI/talks/main/packages/2024-08-21-kubecon-hk/public/screenshot.png',
    datetime: '2024-08-21',
  },
  {
    title: 'Hacker Numerology',
    author: {
      name: 'HD Moore',
      link: 'https://hdm.io',
    },
    at: 'LASCON 2024',
    slidesLink: 'https://hdm.io/decks/2024-LASCON-Numerology/',
    sourceLink: 'https://github.com/hdm/decks-2024-lascon-numerology.git',
    cover: 'https://raw.githubusercontent.com/hdm/decks-2024-lascon-numerology/refs/heads/main/screenshot.png',
    datetime: '2024-10-25',
  },
  {
    title: 'Python Zero To Hero - Episode 1',
    author: {
      name: 'Kareim Tarek',
      link: 'https://kareimgazer.github.io/',
    },
    at: 'Kareem Kreates YouTube Channel',
    slidesLink: 'https://kareimgazer.github.io/py-intro/',
    sourceLink: 'https://github.com/KareimGazer/py-intro',
    cover: 'https://i.ytimg.com/vi/hVMaPBrWvAo/hqdefault.jpg',
    datetime: '2025-01-12',
  },
  {
    title: 'Taming Dependency Chaos for LLM in K8s',
    author: {
      name: 'Neko',
      link: 'https://github.com/nekomeowww',
    },
    at: 'KubeCon 2025 China',
    slidesLink: 'https://baizeai.github.io/talks/2025-06-11-kubecon-hk/',
    sourceLink: 'https://github.com/BaizeAI/talks/tree/main/packages/2025-06-11-kubecon-hk',
    cover: 'https://raw.githubusercontent.com/BaizeAI/talks/main/packages/2025-06-11-kubecon-hk/public/screenshot.png',
    datetime: '2025-06-11',
  },
  {
    title: 'Single Image Super-Resolution Based on Capsule Neural Networks',
    author: {
      name: 'George Corrêa de Araújo',
      link: 'https://george-gca.github.io/',
    },
    at: 'Brazilian Conference on Intelligent Systems 2023',
    slidesLink: 'https://george-gca.github.io/bracis_2023_srcaps/',
    sourceLink: 'https://github.com/george-gca/bracis_2023_srcaps',
    cover: 'https://raw.githubusercontent.com/george-gca/bracis_2023_srcaps/refs/heads/main/cover.png',
    datetime: '2023-09-27',
  },
  {
    title: 'Threat Modeling',
    author: {
      name: 'guisso',
      link: 'https://github.com/fguisso',
    },
    at: 'OWASP Meetup',
    slidesLink: 'https://guisso.dev/talks/threat-modeling',
    sourceLink: 'https://github.com/fguisso/talks/tree/main/slides/threat-modeling',
    cover: 'https://guisso.dev/posts/threat-modeling-intro/featured-threat-modeling_hu12396ec5bf9ecba1dda33f1443a5eb10_76776_600x0_resize_box_3.png',
    datetime: '2023-09-22',
  },
  {
    title: 'A 14-year journey developing nCine, an open-source 2D game framework',
    author: {
      name: 'Angelo Theodorou',
      link: 'https://encelo.github.io',
    },
    at: '/dev/games/2025',
    slidesLink: 'https://encelo.github.io/nCine_14Years_Presentation/',
    sourceLink: 'https://github.com/encelo/nCine_14Years_Presentation',
    cover: 'https://i.imgur.com/AbTdfhg.png',
    datetime: '2025-06-05',
  },
  {
    title: 'Reverse Engineering Denuvo in Hogwarts Legacy',
    author: {
      name: 'Maurice Heumann',
      link: 'https://momo5502.com',
    },
    at: 'Navaja Negra 2025',
    slidesLink: 'https://momo5502.com/slides/denuvo',
    sourceLink: 'https://github.com/momo5502/denuvo-slides',
    cover: 'https://raw.githubusercontent.com/momo5502/denuvo-slides/refs/heads/master/images/preview.png',
    datetime: '2025-10-03',
  },
  // Add yours here!
  {
    title: 'Yours?',
    author: {
      name: '',
    },
    at: 'Submit your talk/presentation to be list here!',
    slidesLink: 'https://github.com/slidevjs/slidev/edit/main/docs/.vitepress/showcases.ts',
    cover: `${import.meta.env.BASE_URL}theme-placeholder.png`,
    datetime: '2020-1-1',
  },
].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
