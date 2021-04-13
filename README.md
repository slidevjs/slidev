# vite-slides

Markdown to Slides, powered by Vite and Windi CSS

## Motivation


I am making this because preparing slides in PowerPoint / Keynote / Google Slides is just painful to me as I need to highlight my code snippet and paste them as images. Layouting and updating code is also laborious and time-consuming. 

So as a frontend developer, why not solve it the way that fits better with what I am good that?

## Status

Status: **Prototype**

Currently, I will focus more on the content of the slides I need myself. I will update the slides of my next talk with it (you can also have a preview of it :P). **Think it as a template for making slides at this moment**. After finishing my talk, I will make this a standalone tool like VitePress where all you need is a command with a markdown file.

Ideal usage:

```bash
vim slides.md
npx vite-slides
```

```bash
npx vite-slides build
```

```bash
npx vite-slides export talk.pdf
```

## TODO

- [x] Markdown to Slides
- [x] Prism hightlighting 
- [x] Embedded Monaco
- [ ] Preload next slide
- [ ] Shiki + TwoSlash
- [ ] Export PDF
- [x] Monaco as markdown
- [ ] Standalone package
- [ ] Configurable themes

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2021 [Anthony Fu](https://github.com/antfu)
