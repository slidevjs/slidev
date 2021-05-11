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

##### *(this is not meant as a developper environnement, as it uses only npm-fetched binaries)*

Pull the image :

```bash
$ docker pull stig124/slidev:latest
```

> [podman](https://podman.io/) users can pull the image using the complete URL
>
> ```bash
> $ podman pull docker.io/stig124/slidev:latest
> ```


Go into a directory with a `slides.md` file and run it :

```bash
$ docker run --rm -v .:/root/slides -p 3000:3030 stig124/slidev:latest
```

> You can change the port that will face outside by changing the number left of the port declaration => `3000:3030`

Open a browser on `localhost:3000` and you're ready to go, you can leave at any time using `Ctrl` + `C`

> Please note that if you have a `node_modules` folder within the folder with the `slides.md` file, It will be **deleted** *(You can add `-e KEEP=1` next to `--rm` in the command to revert this behaviour)* as it may blocks the starting of the container

### Build the docker image

If you want to build the image by yourself, you can :

Clone the repo

```bash
$ git clone https://github.com/slidevjs/slidev.git
```

> As the image downloads `slidev` from npm, you can also just download the `Dockerfile` and `entrypoint.sh` from the `Github` website

Go to the folder where you have the `Dockerfile` and `entrypoint.sh` file

```bash
$ docker build -t <tag> .
```

> The tag syntax is as follows `username`/`image_name`:`version`  
> *`username` is mandatory only if you want to push to remote registry*

Then run it as you want :

```bash
$ docker run --rm -v .:/root/slides -p 3000:3030 <whatever tag you have set>
```