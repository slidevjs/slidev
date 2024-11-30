<template>
  <div class="xl:grid xl:grid-cols-[3fr_4fr] gap-4" min-h-80vh px8 xl:px20 py5 max-w-100vw xl:max-w-450 mxa>
    <div flex="~ col items-center justify-center" min-h-150>
      <h1 hidden>
        Slidev
      </h1>
      <img src="/logo-title.png" alt="Slidev" w-80 xl:w-100 xl:mt--35>
      <h2 text-3xl mt--5 op80 text-center>
        Presentation Slides for Developers
      </h2>
      <div flex="~ gap-3 justify-center" p4 mt-5>
        <a href="/guide/" class="bg-$vp-c-brand-3 text-white! no-underline! px5 py3 text-xl font-bold rounded-xl hover:bg-$vp-c-brand-1 h-max">Get Started</a>
        <a href="/guide/why" class="bg-$vp-c-gray-1 text-white! no-underline! px5 py3 text-xl font-bold rounded-2xl hover:bg-$vp-c-brand-1 h-max">Why</a>
      </div>
    </div>
    <div flex>
      <div w-180 ma>
        <ClientOnly>
          <Demo />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>
