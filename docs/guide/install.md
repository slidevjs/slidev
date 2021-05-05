# Installation

## Starter Template

The best way to get started is to use our official stater template.

With NPM:

```bash
$ npm init slidev
```

With Yarn:

```bash
$ yarn create slidev
```

It contains the setup and a short demo with instructions on how to use it. Definitely give it a try.

## Install Manually

If you still prefer to install it manually or want to integrate it into your existing projects, you can do:

```bash
$ npm install @slidev/cli @slidev/theme-default

$ touch slides.md

$ npx slidev
```

> Please note if you are using [pnpm](https://pnpm.io), you will need to enable [shamefully-hoist](https://pnpm.io/npmrc#shamefully-hoist) option to make it work properly
>
> `echo 'shamefully-flatten=true' >> .npmrc`
