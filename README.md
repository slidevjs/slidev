<p align="center">
<img src="./docs/public/logo.svg" height="130" width="130"/>
</p>

<h1 align="center"><b>Sli</b>dev</h1>

<p align="center">
Presentation <b>slide</b>s for <b>dev</b>elopers 🧑‍💻👩‍💻👨‍💻
</p>

## Features

- Single markdown entry for composing your slides. With embedded Vue components support.
- Powered by [Vite](https://github.com/vitejs/vite) - instant reloading & updating ⚡️
- Built-in syntax highlighting supported via [Prism](https://github.com/PrismJS/prism)
- Built-in [Monaco editor](https://github.com/Microsoft/monaco-editor) support for live coding in your presentations (with TypeScript!)
- Built-in camera and recording support
- Fully customizable and themeable
- Styling powered by [Windi CSS](https://github.com/windicss/windicss)
- Reuses [Vite's huge ecosystem](https://github.com/vitejs/awesome-vite)

## Motivation

I am making this because preparing slides in PowerPoint / Keynote / Google Slides is just painful to me as I need to highlight my code snippet and paste them as images. Layouting and updating code is also laborious and time-consuming. 

So as a frontend developer, why not solve it the way that fits better with what I am good that?

## Status

Status: **Alpha**

~~Currently, I will focus more on the content of the slides I need myself. I will update the slides of my next talk with it (you can also have a preview of it :P). **Think it as a template for making slides at this moment**. After finishing my talk, I will make this a standalone tool like VitePress where all you need is a command with a markdown file.~~

Alright, I broke my words again, it's now available as an standalone tool 🎉

Try it now with

```bash
npm init slidev
```

Still, it's working but not ready yet. It might have some big refactor or even stacks changes in the future. Feel free to play with it and have a preview first.

For a full example, you can check the [demo](./demo) folder, which is a draft for my next talk 😉.

## Getting Started

Under your project root, you will have a markdown file `slides.md`. The format will be like several mardown files with frontmatters concating together.

```md
---
layout: cover
---

# Vite Slides

Hello World

<!-- Second page --->
---
layout: default
---

# Page 2

`​``ts
console.log('HelloWorld')
`​``

<!-- Third page --->
------

# Page 3

If there is no frontmatter needed, you can omit them and simply use 6 dashes.
```

They will split auto into slides automatically.

### Code Snippet

A big reason I am making this is that I need to make code looks right in the slides. So just as you expected, you can use markdown favored code block to hightlight your code.

```md
`​``ts
console.log('HelloWorld')
`​``
```

Whenever you want to do some modification in the presentation, simply add `{monaco}` after the language id, it will turns the block into a full featured Monaco editor!

```md
`​``ts{monaco}
console.log('HelloWorld')
`​``
```

### Styling

Since Markdown naturally supports embedded HTML markups. You can actually style your contents the way you want. To provide some convenience, we have [Windi CSS](https://github.com/windicss/windicss) built-in, where you can style directly with class utilities, for example

```html
<div class="grid grids-cols-[100px,1fr] gap-4 pt-4">

### Name

- Item 1
- Item 2

</div>
```

Check out [Windi CSS's docs](https://windicss.org) for more details.

### Object Animations

To apply "click animations" for elements, you can use the `v-click` directive or `<v-click>` components

```md
# Hello

<!-- this will be invisible until you press next -->
<v-click>

Hello World

</v-click>

<!-- this will be invisible until you press next the second time -->
<v-click>

Hey!

</v-click>
```

### Components

Create a directory `components/` under your project root, and simply put your favorite Vue components under it, then you can use it with the same name in your markdown file!

```
components/
  MyComponent.vue
  FooBar.vue
```

```md
<!-- slides.md -->

Use your component: 

<MyComponent :prop="1"/>

This also works:

<foo-bar />
```

### Theme

> Not ready yet. See [packages/theme-default](./packages/theme-default) first if you are interested.

### Command

**Dev**

```bash
slidev
```

**Build**

```bash
slidev build
```

**Export**

```bash
npm i -D playwright
slidev export
```

## TODO

- [ ] Foot notes
- [ ] Custom Monaco setup
- [ ] Configuration in header
- [ ] Preload next slide
- [ ] Shiki + TwoSlash?
- [ ] Embedded editor
- [ ] Hide dev buttons on build
- [ ] VS Code extension
- [ ] Timer
- [ ] A few more themes
- [x] Camera view
- [x] Recording!
- [x] Markdown to Slides
- [x] Prism hightlighting 
- [x] Embedded Monaco
- [x] Monaco as markdown
- [x] Slides Overview
- [x] `v-click` directive
- [x] Standalone package
  - [x] Dev Mode
  - [x] Build Mode
  - [x] Export PDF
  - [x] Configurable themes

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2021 [Anthony Fu](https://github.com/antfu)
