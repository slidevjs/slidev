# Installation

## Starter Template

The best way to get started is using our official starter template.

With NPM:

```bash
$ npm init slidev
```

With Yarn:

```bash
$ yarn create slidev
```

It contains the setup and a short demo with instructions on how to use it. You should definitely give it a try.

## Install Manually

If you still prefer to install Slidev manually or would like to integrate it into your existing projects, you can do:

```bash
$ npm install @slidev/cli @slidev/theme-default
```
```bash
$ touch slides.md
```
```bash
$ npx slidev
```

> Please note if you are using [pnpm](https://pnpm.io), you will need to enable [shamefully-hoist](https://pnpm.io/npmrc#shamefully-hoist) option for Slidev to work properly:
>
> ```bash
> echo 'shamefully-flatten=true' >> .npmrc
> ```
