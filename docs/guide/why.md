# Why Slidev

## The Problems

There are a lot of feature-rich, general-purpose, WYSIWYG slides makers like [Microsoft PowerPoint](https://www.microsoft.com/en-us/microsoft-365/powerpoint) and [Apple Keynote](https://www.apple.com/keynote/). They work pretty well on making nice slides with animations, charts, and many other things, while being very intuitive and easy to learn. So why bother making Slidev?

Slidev is trying to provide the flexibility and interactivity for developers to make their presentation even more interesting, expressive, and attractive by using the tools and technologies they are already familiar with. Slidev separates the content and visuals. This allows you to focus on one thing at a time, while being able to reuse the themes from the community.

Slidev does not tend to replace those slides apps or being beginner-friendly. Here are a few notions and highlights of Slidev:

## Markdown-based

Slidev uses an extended Markdown format to store and organize your slides in a single plain text file. This lets you focus on making the content. And since the content and styles are separated, this also made it possible to switch between different themes effortlessly.

Learn mode about the slides [Markdown Syntax](/guide/syntax).

## Themable

Themes for Slidev can be shared and installed using npm packages. And apply them with only one line of config.

Check out the [theme gallery](/themes/gallery) or [how to write a theme](/themes/write-a-theme).

## Developer Friendly

Slidev provides first-class support for code snippets for developers. It uses [Prism](https://prismjs.com/) or [Shiki](https://github.com/shikijs/shiki) to get the accurate, pixel prefect syntax highlighting where you can modify anytime. With [Monaco editor](https://microsoft.github.io/monaco-editor/) built-in, it also empowers you to do live coding / demonstration in your presentation with autocompletion, type hovering, and even TypeScript type check support. 

Learn more about [highlighters](/custom/highlighters) and [Monaco configuration](/custom/config-monaco).

## Fast

Slidev is powered by [Vite](https://vitejs.dev/), [Vue 3](https://v3.vuejs.org/) and [Windi CSS](https://windicss.org/), which give you the most wonderful authoring expirenice. Every change you made will reflect to your slides **instantly**.

Find more about our [tech stacks](/guide/#tech-stacks).

## Interactive & Expressive

You can write custom Vue components and use them directly inside your markdown file. And interact with them in the presentation to express your idea in a way that more interserting and intuitive.

## Recording Support

Slidev provides built-in recording and camera view. You can share your presentation with your camera view inside, or record and save them separately for your screen and camera. All with one go, no additional tools are needed.

Learn more about the [recording here](/guide/recording).

## Portable

Export your slides into PDF, PNGs, or even a hostable Single-page Application (SPA) with a single command, and share them anywhere.

Learn more about [exporting](/guide/exporting).

## Hackable

Since Slidev is powered by web technologies, anything that can be done with web apps are also possible with Slidev. For example, WebGL, API requesting, iframes, or even live sharing, it's up to your imaginations!

## Give it a Try

Give it a play more than a thousand words. You are just one command away:

```bash
npm init slidev
```
