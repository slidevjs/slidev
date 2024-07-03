---
outline: deep
---

# Getting Started

Slidev <sup>(slide + dev, **/slaɪdɪv/**)</sup> is a web-based slides maker and presenter. It's designed for developers to focus on writing content in Markdown while having the power of HTML and Vue to deliver pixel-perfect designs with embedded interactive demos in your presentation.

It uses a feature-rich Markdown syntax to generate beautiful slides with an instant updating experience, along with many built-in integrations such as live coding, PDF exporting, presentation recording, and so on. Since it's powered by the web, you can do anything with Slidev - the possibilities are limitless.

You can learn more about the rationale behind this project in the [Why Slidev](/guide/why) section.

## Features

- 📝 [**Markdown-based**](/guide/syntax.html) - foucus on content and use your favorite editor
- 🧑‍💻 [**Developer Friendly**](/guide/syntax.html#code-blocks) - built-in syntax highlighting, live coding, etc.
- 🎨 [**Themable**](/themes/gallery.html) - theme can be shared and used with npm packages
- 🌈 [**Stylish**](/guide/syntax.html#embedded-styles) - on-demand utilities via [UnoCSS](https://github.com/unocss/unocss).
- 🤹 [**Interactive**](/custom/directory-structure.html#components) - embedding Vue components seamlessly
- 🎙 [**Presenter Mode**](/guide/presenter-mode.html) - use another window, or even your phone to control your slides
- 🎨 [**Drawing**](/guide/drawing.html) - draw and annotate on your slides
- 🧮 [**LaTeX**](/guide/syntax.html#latex) - built-in LaTeX math equations support
- 📰 [**Diagrams**](/guide/syntax.html#diagrams) - creates diagrams using textual descriptions with [Mermaid.js](https://mermaid.js.org/)
- 🌟 [**Icons**](/guide/syntax.html#icons) - Access to icons from any icon set directly
- 💻 [**Editors**](/guide/editors.html) - integrated editor, or [extension for VS Code](https://github.com/slidevjs/slidev-vscode)
- 🎥 [**Recording**](/guide/recording.html) - built-in recording and camera view
- 📤 [**Portable**](/guide/exporting.html) - export into PDF, PNGs, or PPTX
- ⚡️ [**Fast**](https://vitejs.dev) - instant reloading powered by [Vite](https://vitejs.dev)
- 🛠 [**Hackable**](/custom/) - using Vite plugins, Vue components, or any npm packages

<!-- <FeaturesAnimation /> -->

## Creating a Slides Project

### Try it Online

Start Slidev right now in your browser: [sli.dev/new](https://sli.dev/new)

[![](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://sli.dev/new)

### Create Locally

You should have [Node.js](https://nodejs.org) installed. Then, create a new Slidev project with the following command:

::: code-group

```bash [npm]
npm init slidev@latest
```

```bash [pnpm]
pnpm create slidev
```

```bash [yarn]
yarn create slidev
```

:::

Follow the prompts to start your slides project. The slides content is in `slides.md`, which initially includes demos of most the Slidev features. For more information about the Markdown syntax, please check the [syntax guide](/guide/syntax). <!-- TODO: -->

:::: details Single file usage (not recommended)

If you prefer to have a single Markdown file as your slides, you can install the Slidev CLI globally:

::: code-group

```bash [npm]
npm i -g @slidev/cli
```

```bash [pnpm]
pnpm i -g @slidev/cli
```

```bash [yarn]
yarn global add @slidev/cli
```

:::

Then, you can create and start a single file slides with:

```bash
slidev slides.md
```

::::

## Basic Commands

Slidev provides a set of commands. Here are some of the most common ones:

- `slidev` - Start the dev server ([learn more](../builtin/cli#dev))
- `slidev build` - Build the slides for production ([learn more](../builtin/cli#build))
- `slidev export` - Export the slides to PDF, PNGs, or PPTX ([learn more](../builtin/cli#export))
- `slidev format` - Format the slides content ([learn more](../builtin/cli#format))
- `slidev --help` - Show the help message

To run these commands, you can add them to your `package.json` scripts (which is has been done for you if you used the `npm init slidev` command):

```json
{
  "scripts": {
    "dev": "slidev --open",
    "build": "slidev build",
    "export": "slidev export"
  }
}
```

Then, you can run them with `npm run dev`, `npm run build`, and `npm run export`.

For more information about the CLI, please check the [CLI guide](../builtin/cli).

<!--

## Command Line Interface

In a project where Slidev is installed, you can use the `slidev` field in your npm scripts:

```json
{
  "scripts": {
    "dev": "slidev", // start dev server
    "build": "slidev build", // build for production SPA
    "export": "slidev export" // export slides to pdf
  }
}
```

Otherwise, you can use it with [`npx`](https://github.com/npm/cli/blob/latest/bin/npx):

```bash
$ npx slidev
```

Run `slidev --help` for more options available.

## Markdown Syntax

Slidev reads your `slides.md` file under your project root and converts them into slides. Whenever you make changes to it, the content of the slides will be updated immediately. For example:

````md
# Slidev

Hello World

---

# Page 2

Directly use code blocks for highlighting

```ts
console.log('Hello, World!')
```

---

# Page 3
````

Read more about the Slidev Markdown syntax in the [syntax guide](/guide/syntax).

-->

## Tech Stack

Slidev is made possible by combining these tools and technologies.

- [Vite](https://vitejs.dev) - An extremely fast frontend tooling
- [Vue 3](https://v3.vuejs.org/) powered [Markdown](https://daringfireball.net/projects/markdown/syntax) - Focus on the content while having the power of HTML and Vue components whenever needed
- [UnoCSS](https://github.com/unocss/unocss) - On-demand utility-first CSS framework, style your slides at ease
- [Shiki](https://github.com/shikijs/shiki), [Monaco Editor](https://github.com/Microsoft/monaco-editor) - First-class code snippets support with live coding capability
- [RecordRTC](https://recordrtc.org) - Built-in recording and camera view
- [VueUse](https://vueuse.org) family - [`@vueuse/core`](https://github.com/vueuse/vueuse), [`@vueuse/head`](https://github.com/vueuse/head), [`@vueuse/motion`](https://github.com/vueuse/motion), etc.
- [Iconify](https://iconify.design/) - Iconsets collection.
- [Drauu](https://github.com/antfu/drauu) - Drawing and annotations support
- [KaTeX](https://katex.org/) - LaTeX math rendering.
- [Mermaid](https://mermaid-js.github.io/mermaid) - Textual Diagrams.
