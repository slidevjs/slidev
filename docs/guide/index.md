# Getting Started

## Overview

Slidev <sup>(slide + dev, `/slʌɪdɪv/`)</sup> is a web-based slides maker and presenter. It's designed for developers to focus on writing content in Markdown while having the power of HTML and Vue components to deliver pixel-perfect layout and designs, with embedded interactive demos in your presentations.

It uses a feature-rich markdown file to generate beautiful slides with an instant reloading experience. Along with many built-in integrations like live coding, PDF exporting, presentation recording, and so on. Since it's powered by the web, you can actually do anything on that - the possibility is unlimited.

You can learn more about the rationale behind the project in the [Why Slidev](/guide/why) section.

### Tech Stacks

Slidev is made possible by combining these tools and technologies.

- [Vite](https://vitejs.dev) - An extremely fast frontend tooling
- [Vue](https://v3.vuejs.org/) powered [Markdown](https://daringfireball.net/projects/markdown/syntax) - Focus on the content while having the power of HTML and Vue components whenever needed
- [Windi CSS](https://github.com/windicss/windicss) - On-demand utility-first CSS framework, style your slides at ease
- [Prism](https://github.com/PrismJS/prism), [Shiki](https://github.com/shikijs/shiki), [Monaco Editor](https://github.com/Microsoft/monaco-editor) - First-class code snippets support with live coding capability
- [RecordRTC](https://recordrtc.org) - Built-in recording and camera view
- [VueUse](https://vueuse.org) family - [`@vueuse/head`](https://github.com/vueuse/head), [`@vueuse/motion`](https://github.com/vueuse/motion), etc.

### Scaffolding Your First Presentation

With NPM:

```bash
$ npm init slidev
```

With Yarn:

```bash
$ yarn create slidev
```

Follow the prompts and start making your slides now! To get more details of the markdown syntax, [read more here](/guide/syntax).

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

Or you can use it with [`npx`](https://www.npmjs.com/package/npx)

```bash
$ npx slidev
```

Run `slidev -h` for more options avaliable.

### Markdown Syntax

Slidev reads your `slides.md` file under your project root and converts them into slides. Whenever you made changes to it, the content of the slides will be updated immediately. For example:

~~~md
# Slidev

Hello World

---

# Page 2

Directly use code blocks for highlighting

```ts
console.log('Helle World')
`​``

---

# Page 3
~~~

Read more about [the Markdown syntax](/guide/syntax).
