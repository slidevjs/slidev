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

##### *this is not meant to be a developing environment, it uses only npm-fetched distributions*

Pull the image :

```bash
$ docker pull stig124/slidev:latest

or

$ podman pull docker.io/stig124/slidev:latest
```

Go into a directory with a `slides.md` file and run it :

```bash
$ docker run --rm -v .:/root/slides -p 3000:3030 stig124/slidev:latest
```

**WARNING** : If you have a `node_modules` folder within the folder with the `slides.md` file, It will be **deleted** *(You can add `-e KEEP=1` next to `--rm` in the command to revert this behaviour)* as it may blocks the starting of the container

You can :

- Run it in the backgroud by adding `-d`
- Change the default port by replacing the `3000` in the port declaration

Open a browser on `localhost:3000` *(or your public IP)* and you're ready to go, you can leave at any time using `Ctrl` + `C`

> Containers in the background can be stopped using `docker stop <id>` then `docker rm <id>`(`id` you can find using `docker ps -a`)

### Build the docker image

If you want to build the image by yourself, you can :

Clone the `container` repo and build the image :

```bash
$ git clone https://github.com/slidevjs/container.git
$ cd container
$ docker build -t <tag> .
```

> The tag syntax is as follows `username`/`image_name`:`version`  
> *`username` is mandatory only if you want to push to remote registry*

Then run it as you want :

```bash
$ docker run --rm -v .:/root/slides -p 3000:3030 <whatever tag you have set>
```
