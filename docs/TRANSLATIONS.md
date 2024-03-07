# Help on Translating

<!-- For translations maintainers: You don't need to translate this port -->

First of all, thank you for being interested in contributing to translations!

You can find the repositories for each existing translation in [README.md](./README.md). To help improve them, simply sending a Pull Request to their repo.

If the language you want to contribute isn't on the list, join [our Discord server](https://chat.sli.dev), and find the `#translations` channel to see if someone is already working on the language you want, consider joining them and translate together. If not, you can start a new translation project with the following steps.

In case it's already been translated but you're wondering how to maintain it, skip to the end.

## Some tips before you get started

- It is recommended that you use your IDE of choice (e.g VSCode) paired with a development server running, so you can see your translation changes in real-time.
- You can mark these checkmarks as the translation progresses or use your own workflow. The translations don't need to be made in any particular order.
- Translations don't need to be literal, but they should convey the same message. In case you're not sure how to translate something, you can either leave it as it is or use online tools like WordReference or Linguee to aid you.
- Most translations will simply consist in editing Markdown files. Certain areas are buried under Vue components, which will be listed below. You can also use your IDE to find the string to translate.

## Getting started

- [ ] Fork the main docs repo: [slidevjs/docs](https://github.com/slidevjs/docs)
- [ ] Translate README.md, you can take one of the already translated repositories as an example.
- [ ] Share your repo's link to the `#translations` channel telling people you are working on it and find collaborators.

## Translating Markdown files

- [ ] `showcases.md` - A gallery showcase of Slidev presentations.
- [ ] `index.md` - Mainpage content, note that some of it is buried under Vue components listed further below.

### .vitepress/

- [ ] `config.js` - Sitemap
- [ ] `/theme/components/WorkingInProgress.vue` - WIP notice shown in mainpage
- [ ] `/theme/components/demo/Demo.vue` - Animated demo shown in mainpage
- [ ] `/theme/components/Environment.vue` - Describes the environment of a setting.

### builtin/

- [ ] `components.md` - Use [Vue components](https://v3.vuejs.org/guide/component-basics.html) inside Slidev
- [ ] `layouts.md` - Use Vue layouts inside Slidev

### custom/

- [ ] `config-katex.md` - Configuring Katex
- [ ] `config-mermaid.md` - Configuring Mermaid
- [ ] `config-monaco.md` - Configuring Monaco
- [ ] `config-shortcuts.md` - Configuring Shortcuts
- [ ] `config-vite.md` - Configuring Vite
- [ ] `config-vue.md` - Configuring Vue
- [ ] `directory-structure.md` - Configuring the directory structure
- [ ] `fonts.md` - Configuring fonts
- [ ] `global-layers.md` - Configuring the global layers
- [ ] `highlighters.md` - Configuring code highlighters
- [ ] `index.md`- Customizations index page
- [ ] `vue-context.md` - The Vue global context

### guide/

- [ ] `animations.md` - Animations and transitions
- [ ] `editors.md` - Editor integrations
- [ ] `exporting.md`- Exporting your slides
- [ ] `faq.md` - Frequent Answered Questions
- [ ] `index.md` - Getting started with Slidev
- [ ] `navigation.md` - Navigation across slides
- [ ] `presenter-mode.md`- Toggling presenter mode
- [ ] `recording.md`- Recording your presentation
- [ ] `syntax.md` - Markdown syntax
- [ ] `why.md` - _Why Slidev?_

### resources/

- [ ] `covers.md` - Curated covers for Slidev

### themes/

- [ ] `gallery.md` - Theme gallery
- [ ] `use.md` - How to use Slidev themes
- [ ] `write-a-theme.md` - Write your own theme

### addons/

- [ ] `use.md` - How to use Slidev addons
- [ ] `write-an-addon.md` - Write your own addon

## Publishing your translations

- [ ] When you finish the translation (at least 90%), `@antfu` in the Discord and we will invite you to the org and make the translation official.
- [ ] Once the transferring is done, we will set up the subdomain, auto-deployment, and a daily sync-up bot to keep the translation up-to-date with the latest English docs.
- [ ] The site is live, and we will send a shout-out tweet on [our Twitter account](https://twitter.com/Slidevjs).

## Maintaining the translations up-to-date

- `docschina-bot` will periodically submit merge requests from the `slidev/docs` repository. Switch to the branch created in the pull request, make any changes necessary and merge it. [example](https://github.com/slidevjs/docs-fr/pull/13).
- Sometimes it will occur that a merge request is made and you haven't merged the previous one. The latest PR always checks your main branch against the English one; so you can just close the previous PR(s), move your work to the latest one and merge it.

[Working-in-progress translation list](https://discord.com/channels/851817370623410197/851822360955977760/852614294017146900)

Thanks again!
