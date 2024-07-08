---
outline: deep
---

# Why Slidev

There has been lots of feature-rich WYSIWYG slides makers like [Microsoft PowerPoint](https://www.microsoft.com/en-us/microsoft-365/powerpoint) and [Apple Keynote](https://www.apple.com/keynote/). They are intuitive and easy to learn. So why bother making Slidev?

Slidev aims to provide flexibility and interactivity for **developers** to make their presentations much more interesting, expressive, and attractive by using technologies they are familiar with. Slidev is also completely open source, and has a strong community to support it.

On one hand, Slidev is a Markdown-based presentation tool, which means you can write your slides in Markdown, and focus on the content. On the other hand, Slidev is also a Web-based tool, which means **nothing is impossible** - you can do anything you can do in a web app in Slidev.

![demo slide](/screenshots/cover.png) {#welcome}

## Coolest Features

### 📝 Markdown-based

Slidev uses an extended Markdown format to organize your slides in a single plain text file. This helps you focus on the content, and makes it easy to write and maintain your slides. You can use any text editor you like, and version control your slides with Git.

> Learn more: <LinkInline link="guide/syntax"/>.

### 🧑‍💻 Developer Friendly

Slidev provides first-class support for code snippets for developers. It uses [Shiki](https://github.com/shikijs/shiki) to get the most accurate syntax highlighting. Slidev also supports <LinkInline link="feature/shiki-magic-move"/> and <LinkInline link="feature/twoslash"/>. These make Slidev the best choice for tech talks.

### 🎨 Themable

Themes for Slidev can be shared via npm packages. You apply a theme within one line of code.

Check out the [Theme Gallery](../resources/theme-gallery) for the beautiful themes made by the official team and the community.

### ⚡ Fast

Every change you make in the editor will reflect to your slides in the browser **instantly** without reloading, thanks to [Vite's HMR feature](https://vitejs.dev/guide/features.html#hot-module-replacement).

### 🤹 Interactive & Expressive

You can write Vue components and use them in your slides, which you can then interact with them during the presentation to express your idea in a more interesting and intuitive way.

Slidev also has a built-in support of <LinkInline link="feature/monaco-editor"/>, which empowers you to do live coding in your presentation with autocompletion and hover message.

### 🎥 Recording Support

Slidev provides built-in recording and camera view. You can share your presentation with your camera view inside, or record and save your screen and camera separately.

> Learn more: <LinkInline link="feature/recording"/>.

### 📤 Portable

You can export your slides into PDF, PPTX, PNGs, or even a single-page application (SPA) within a single command. Then you can share or host it anywhere you like.

> Learn more: <LinkInline link="guide/exporting"/> and <LinkInline link="guide/hosting"/>.

### 🛠 Hackable

Because Slidev is web-based, everything that can be done in a normal web app can be applied to your slides. For example, WebGL, API requests, iframes, or even live sharing. It's up to your imagination!

> Learn more: [Customization](../custom/).

## Give it a Try

Playing around with Slidev will tell you more than thousands of words. Check the [Getting Started](./) guide to create your first Slidev project in one click or one command.

Or you can have a quick preview of it:

<iframe class="aspect-16/9 rounded-xl w-full shadow-md border-none" src="https://www.youtube.com/embed/eW7v-2ZKZOU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
