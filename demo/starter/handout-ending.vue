<template>
  <div class="text-slate-800">
    <div
      data-handout-page
      class="break-after-page px-16 py-20 leading-relaxed bg-white"
    >
      <h2 class="text-3xl font-bold tracking-tight text-slate-900">
        Keep exploring Slidev
      </h2>
      <p class="mt-6 text-sm max-w-2xl">
        This demo highlighted Slidev's text-centric authoring, navigation aids, and live coding capabilities. Use the prompts below
        to turn the starter deck into your own developer-friendly presentations.
      </p>
      <div class="mt-12 grid grid-cols-2 gap-10 text-sm">
        <div>
          <h3 class="uppercase text-xs tracking-widest font-semibold text-slate-500">
            Try it yourself
          </h3>
          <ol class="mt-3 space-y-2 list-decimal list-inside">
            <li>Run <code>pnpm dev</code> and explore the navigation drawer and presenter mode.</li>
            <li>Swap the welcome slide content and background image to match your story.</li>
            <li>Embed a Vue component or external code sample to showcase interactive docs.</li>
          </ol>
        </div>
        <div>
          <h3 class="uppercase text-xs tracking-widest font-semibold text-slate-500">
            Enhance your deck
          </h3>
          <ul class="mt-3 space-y-2">
            <li>• Document useful keyboard shortcuts in early slides.</li>
            <li>• Use the <code>&lt;Toc&gt;</code> component to keep longer talks scannable.</li>
            <li>• Apply UnoCSS utilities or scoped styles to reinforce your brand.</li>
          </ul>
        </div>
      </div>
    </div>
    <div
      data-handout-page
      class="px-16 py-20 bg-white leading-relaxed"
    >
      <h2 class="text-2xl font-semibold tracking-tight text-slate-900">
        Resources &amp; community
      </h2>
      <p class="mt-4 text-sm">
        Continue learning with the official guides and community spaces below. They mirror the references called out across the
        slides and help you dive deeper into advanced workflows.
      </p>
      <div class="mt-8 space-y-4 text-sm">
        <div>
          <h3 class="font-semibold text-slate-600">
            Documentation quick hits
          </h3>
          <ul class="mt-2 space-y-1">
            <li><strong>sli.dev/guide/why</strong> — Understand the philosophy behind text-first slides</li>
            <li><strong>sli.dev/guide/ui</strong> — Learn every navigation control shown in the demo</li>
            <li><strong>sli.dev/features/line-highlighting</strong> — Recreate the code walkthrough effects</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold text-slate-600">
            Stay in touch
          </h3>
          <p class="mt-2">
            Join the community on <strong>Discord</strong>, follow <strong>@slidevjs</strong> for release news, or browse the
            theme gallery for inspiration. Share what you build — we love seeing Slidev in the wild!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
