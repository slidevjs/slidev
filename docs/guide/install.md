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

## Install on Docker

If you need a rapid way to run a presentation, you can use the prebuilt (or even build your own) [docker](https://hub.docker.com/r/stig124/slidev) image (maintained by [stig124](https://github.com/Stig124))

### NOTE

This container docs are now in the [container repo](https://github.com/slidevjs/container)

### TL;DR

In a folder with `slides.md` :

```bash
$ docker run --rm -v .:/root/slides -p 3000:3030 stig124/slidev:latest
```