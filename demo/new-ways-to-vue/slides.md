---
layout: cover
highlighter: shiki
remoteAssets: false
---

# New Ways to Vue

<p text="2xl" class="!leading-8">
See how the new tools and techniques affect<br>the way we <b>view</b> and build applications
</p>

<div class="uppercase text-sm tracking-widest" m="t-10">
Anthony Fu
</div>

<div class="abs-bl mx-14 my-12 flex">
  <logos:vue text="2xl"/>
  <div class="ml-3 flex flex-col text-left">
    <div>Vue London</div>
    <div class="text-sm opacity-50">Oct. 20th, 2021</div>
  </div>
</div>


---
layout: 'intro'
---

# Anthony Fu

<div class="leading-8 opacity-80">
Vue & Vite core team member.<br>
Creator of Slidev, VueUse, Vitesse, Type Challenges, etc.<br>
Fanatical open sourceror. Working at <a href="https://nuxtlabs.com" target="_blank">NuxtLabs</a>.<br>
</div>

<div class="my-10 grid grid-cols-[40px,1fr] w-min gap-y-4">
  <ri-github-line class="opacity-50"/>
  <div><a href="https://github.com/antfu" target="_blank">antfu</a></div>
  <ri-twitter-line class="opacity-50"/>
  <div><a href="https://twitter.com/antfu7" target="_blank">antfu7</a></div>
  <ri-user-3-line class="opacity-50"/>
  <div><a href="https://antfu.me" target="_blank">antfu.me</a></div>
</div>

<img src="https://antfu.me/avatar.png" class="rounded-full w-40 abs-tr mt-30 mr-20"/>

---
name: Sponsors
layout: center
---

<img class="h-120 -mt-10" src="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.wide.png" /><br>
<div class="text-center text-xs opacity-50 -mt-8 hover:opacity-100">
  <a href="https://github.com/sponsors/antfu" target="_blank">
    Sponsor me at GitHub
  </a>
</div>

---
layout: center
---

# How Front-end Toolings Evolve

---

# Task Runners

<div flex="~" position="absolute top-10 right-10" gap="4" text="center">
<div flex="~ col">
<logos-gulp text="5xl" m="auto b-2"/>
Gulp
</div>
<div flex="~ col">
<logos-grunt text="5xl" m="auto b-2"/>
Grunt
</div>
</div>

###### Build

Task runners are commonly designed to be used with a single command 

```mermaid {theme: 'neutral'}
flowchart LR
  A([Read]) --> Transforming --> Contacting --> B([Write])
```

<div m="t-8"/>

###### Watch

When we want to have the build process reactive to the file changes, we apply a watcher to rerun the whole build process. This requires users to refresh the page to see the changes.

```mermaid {theme: 'neutral'}
flowchart LR
  subgraph Build
    direction LR
    A([Read]) --> Transforming --> Contacting --> B([Write])
  end
  W([Watch]) --> Build
  Build --> W
```

---

# Bundlers 

<div flex="~" position="absolute top-10 right-10" gap="4" text="center">
<div flex="~ col">
<logos-webpack text="5xl" m="auto b-2"/>
Webpack
</div>
<div flex="~ col">
<logos-rollup text="5xl" m="auto b-2"/>
Rollup
</div>
</div>

- Smarter to know the relationships between the modules
- Unchanged modules can be cached
- HMR

---

# Dev Servers 

<div flex="~" position="absolute top-10 right-10" gap="4" text="center">
<div flex="~ col">
<logos-snowpack text="5xl" m="auto b-2"/>
Snowpack
</div>
<div flex="~ col">
<logos-vite text="5xl" m="auto b-2"/>
Vite
</div>
</div>

- Unbundled
- On-demanded

---

# On-demanded?

What can we do with it?

> Not only about performance but also about opening a new gate to how we think and see the front-end development.

---


---
layout: center
class: 'text-center pb-5'
---

# Thank You!

Slides can be found on [antfu.me](https://antfu.me)
