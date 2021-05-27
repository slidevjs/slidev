# Installation

## Starter Template

> Slidev requires [**Node.js >=14.0**](https://nodejs.org/)

The best way to get started is using our official starter template.

With NPM:

```bash
$ npm init slidev@latest
```

With Yarn:

```bash
$ yarn create slidev
```

Follow the prompts and it will open up the slideshow at http://localhost:3030/ automatically for you.

It also contains the basic setup and a short demo with instructions on how to get started with Slidev.

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

## Install Globally

From v0.14.0, we shipped **experimental** global installation support. You can install it with the following command 

```bash
$ npm i -g @slidev/cli
```

And then use `slidev` everywhere without creating a project every time.

```bash
$ slidev
```

This command will also try to use local `@slidev/cli` if it has been found in the `node_modules`.

## Install on Docker

If you need a rapid way to run a presentation with containers, you can use the prebuilt [docker](https://hub.docker.com/r/stig124/slidev) image maintained by [stig124](https://github.com/Stig124), or build your own.

Refer to the [slidevjs/container repo](https://github.com/slidevjs/container) for more details.
