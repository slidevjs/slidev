# Why Slidev

There are a lot of feature-rich, general-purpose, WYSIWYG slides makers like [Microsoft PowerPoint](https://www.microsoft.com/en-us/microsoft-365/powerpoint) and [Apple Keynote](https://www.apple.com/keynote/). They work pretty well for making nice slides with animations, charts, and many other things, while being very intuitive and easy to learn. So why bother making Slidev?

Slidev aims to provide the flexibility and interactivity for developers to make their presentations even more interesting, expressive, and attractive by using the tools and technologies they are already familiar with. 

When working with WYSIWYG editors, it is easy to get distracted by the styling options. Slidev remedies that by separating the content and visuals. This allows you to focus on one thing at a time, while also being able to reuse the themes from the community. Slidev does not seek to replace other slide deck builders entirely. Rather, it focuses on catering to the developer community.

## Slidev

![](/screenshots/cover.png)

Here are a few of the coolest features of Slidev:

## Markdown-based

Slidev uses an extended Markdown format to store and organize your slides in a single plain text file. This lets you focus on making the content. And since the content and styles are separated, this also made it possible to switch between different themes effortlessly.

Learn more about [Slidev's Markdown Syntax](/guide/syntax).

## Themable

Themes for Slidev can be shared and installed using npm packages. You then apply them with only one line of config.

Check out the [theme gallery](/themes/gallery) or [learn how to write a theme](/themes/write-a-theme).

## Developer Friendly

Slidev provides first-class support for code snippets for developers. It supports both [Prism](https://prismjs.com/) and [Shiki](https://github.com/shikijs/shiki) to get pixel perfect syntax highlighting, while still being able to modify the code at any time. With [Monaco editor](https://microsoft.github.io/monaco-editor/) built-in, it also empowers you to do live coding / demonstration in your presentation with autocompletion, type hovering, and even TypeScript type check support.

Learn more about [highlighters](/custom/highlighters) and [Monaco configuration](/custom/config-monaco).

## Fast

Slidev is powered by [Vite](https://vitejs.dev/), [Vue 3](https://v3.vuejs.org/) and [Windi CSS](https://windicss.org/), which give you the most wonderful authoring experience. Every change you made will reflect to your slides **instantly**.

Find more about [our tech stack](/guide/#tech-stack).

## Interactive & Expressive

You can write custom Vue components and use them directly inside your markdown file. You can also interact with them inside the presentation to express your idea in a more interesting and intuitive way.

## Recording Support

Slidev provides built-in recording and camera view. You can share your presentation with your camera view inside, or record and save them separately for your screen and camera. All with one go, no additional tools are needed.

Learn more about [recording here](/guide/recording).

## Portable

Export your slides into PDF, PNGs, or even a hostable Single-page Application (SPA) with a single command, and share them anywhere.

Read more about that in the [exporting docs](/guide/exporting).

## Hackable

Being powered by web technologies, anything that can be done in a web app is also possible with Slidev. For example, WebGL, API requests, iframes, or even live sharing. It's up to your imagination!

## Give it a Try

Playing around with Slidev will tell you more than a thousand words. You are just one command away:

```bash
$ npm init slidev
```

Or have a quick preview of it:

<div class="aspect-9/16 relative">
<iframe class="rounded w-full shadow-md border-none" src="https://www.youtube.com/embed/eW7v-2ZKZOU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
