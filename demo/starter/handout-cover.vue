<template>
  <div>
    <div
      data-handout-page
      class="break-after-page h-[270mm] px-16 py-20 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-slate-50 via-white to-slate-100"
    >
      <div>
        <span class="tracking-[0.35em] text-xs font-semibold uppercase text-sky-600">
          Slidev Starter Template
        </span>
        <h1 class="mt-6 text-6xl font-bold border-b-4 border-slate-900 inline-block pr-4">
          Welcome to Slidev
        </h1>
        <p class="mt-6 max-w-xl text-lg leading-relaxed text-slate-700">
          A companion handout for the demo deck that showcases Slidev's text-first authoring, navigation helpers, and Vue-driven
          enhancements. Explore the pages ahead to follow along without missing any of the live interactions.
        </p>
        <div class="mt-10 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          <span class="bg-white/80 px-3 py-2 rounded-full border border-slate-200">Markdown Workflow</span>
          <span class="bg-white/80 px-3 py-2 rounded-full border border-slate-200">Developer Features</span>
          <span class="bg-white/80 px-3 py-2 rounded-full border border-slate-200">Interactive Demos</span>
        </div>
      </div>
      <div class="flex justify-between text-sm font-semibold uppercase tracking-wide text-slate-500">
        <span>{{ new Date().toLocaleDateString() }}</span>
        <span>Prepared by the Slidev Team</span>
      </div>
    </div>
    <div
      data-handout-page
      class="break-after-page px-16 py-20 text-slate-800 leading-relaxed"
    >
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">
        Inside this deck
      </h2>
      <p class="mt-4">
        The slides introduce Slidev, how to navigate a live presentation, and the built-in developer tooling that powers code-focused
        talks. Use this page as a quick reference for the sections you will encounter.
      </p>
      <div class="grid grid-cols-2 gap-10 mt-10 text-sm">
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Highlights
          </h3>
          <ul class="mt-3 space-y-2">
            <li>• Welcome tour of the starter theme</li>
            <li>• Why Slidev embraces a text-based workflow</li>
            <li>• Navigation tips and keyboard shortcuts</li>
            <li>• Code demos with live annotations</li>
          </ul>
        </div>
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Keep an eye out for
          </h3>
          <ul class="mt-3 space-y-2">
            <li>• Embedded <code>&lt;Toc&gt;</code> components for structure</li>
            <li>• Magic Move transitions between code samples</li>
            <li>• UnoCSS utilities applied per-slide</li>
            <li>• Links to deeper documentation throughout</li>
          </ul>
        </div>
      </div>
    </div>
    <div
      data-handout-page
      class="px-16 py-20 text-slate-700 leading-relaxed"
    >
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">
        Adapting the starter
      </h2>
      <p class="mt-4 text-sm">
        Reuse the patterns demonstrated in this deck when crafting your own Slidev presentations. The guidelines below mirror the
        recommendations sprinkled across the slides.
      </p>
      <ol class="mt-6 space-y-3 text-sm list-decimal list-inside">
        <li>Begin with Markdown content, then enhance with Vue components only where interactivity adds clarity.</li>
        <li>Leverage theme tokens and utilities for consistent typography across slides and handouts.</li>
        <li>Document keyboard shortcuts and navigation cues so audiences can revisit the material asynchronously.</li>
      </ol>
      <p class="mt-6 text-xs uppercase tracking-widest text-slate-500">
        Questions? Join the community on Discord or visit sli.dev for more examples.
      </p>
    </div>
  </div>
</template>
