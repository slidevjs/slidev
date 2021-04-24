# Getting Started

## Overview

Slidev is a web-based slides maker and presenetor. It's designed for developers to focus on writting content in Markdown while have the power of HTML and Vue components to deliver the pixel perfect layout designs and embedded interactive demos in your presentations.

Slidev uses a feature-rich markdown file generate the beautiful slides with instant reloading experience. Along with many built-in support like live coding, PDF exporting, presentation recording, and so on. And since it's powered by web, you can actually do anything on that - the possibility is unlimited.

You can learn more about the rationale behind the project in the [Why Slidev](/guide/why) section.

### Tech Stacks

Slidev is made possible by combining these tools and technologies.

- [Vite](https://vitejs.dev) - An extremely fast frontend tooling
- [Vue](https://v3.vuejs.org/) powered [Markdown](https://daringfireball.net/projects/markdown/syntax) - Focus on the content while having the power of HTML and Vue components whenever needed
- [WindiCSS](https://github.com/windicss/windicss) - On-demand utility-first CSS framework, style your slides at ease
- [Prism](https://github.com/PrismJS/prism) + [Monaco Editor](https://github.com/Microsoft/monaco-editor) - First-class code snippets support with live coding capability
- [RecordRTC](https://recordrtc.org) - Built-in recording and camera view
- [VueUse](https://vueuse.org) family - [`@vueuse/head`](https://github.com/vueuse/head), [`@vueuse/motion`](https://github.com/vueuse/motion), etc.

### Scaffolding Your First Slidev

With NPM:

```bash
$ npm init slidev
```

With Yarn:

```bash
$ yarn create slidev
```

Follow the prompts and start making your slides now!

### Command Line Interface

In a project where Slidev is installed, you can use the `slidev` binary in your npm scripts.

```json
{
  "scripts": {
    "dev": "slidev", // start dev server
    "build": "slidev build", // build for production SPA
    "export": "slidev export" // export slides to pdf
  }
}
```

### Markdown Syntax

Slidev reads your `slides.md` file under your project root and convert them into slides. Whenever you made changes to it, the content of slides will be updated immediately.

// TODO:
