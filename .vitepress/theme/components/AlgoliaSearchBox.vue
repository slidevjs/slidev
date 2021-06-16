<template>
  <div id="docsearch" class="algolia-search-box" />
</template>

<script setup lang="ts">
import '@docsearch/css'
import { useRoute, useRouter } from 'vitepress'
import { defineProps, getCurrentInstance, onMounted, watch } from 'vue'
import docsearch from '@docsearch/js'
import type { DocSearchHit } from '@docsearch/react/dist/esm/types'
import type { DefaultTheme } from '../config'

const props = defineProps<{
  options: DefaultTheme.AlgoliaSearchOptions
}>()

const vm = getCurrentInstance()
const route = useRoute()
const router = useRouter()

watch(
  () => props.options,
  (value) => {
    update(value)
  },
)

onMounted(() => {
  initialize(props.options)
})

function isSpecialClick(event: MouseEvent) {
  return (
    event.button === 1
    || event.altKey
    || event.ctrlKey
    || event.metaKey
    || event.shiftKey
  )
}

function getRelativePath(absoluteUrl: string) {
  const { pathname, hash } = new URL(absoluteUrl)

  return pathname + hash
}

function update(options: any) {
  if (vm && vm.vnode.el) {
    vm.vnode.el.innerHTML
      = '<div class="algolia-search-box" id="docsearch"></div>'
    initialize(options)
  }
}

function initialize(userOptions: any) {
  docsearch(
    Object.assign({}, userOptions, {
      container: '#docsearch',

      searchParameters: Object.assign({}, userOptions.searchParameters),

      navigator: {
        navigate: ({ suggestionUrl }: { suggestionUrl: string }) => {
          const { pathname: hitPathname } = new URL(
            window.location.origin + suggestionUrl,
          )

          // Router doesn't handle same-page navigation so we use the native
          // browser location API for anchor navigation
          if (route.path === hitPathname)
            window.location.assign(window.location.origin + suggestionUrl)

          else
            router.go(suggestionUrl)
        },
      },

      transformItems: (items: DocSearchHit[]) => {
        return items.map((item) => {
          return Object.assign({}, item, {
            url: getRelativePath(item.url),
          })
        })
      },

      hitComponent: ({
        hit,
        children,
      }: {
        hit: DocSearchHit
        children: any
      }) => {
        const relativeHit = hit.url.startsWith('http')
          ? getRelativePath(hit.url as string)
          : hit.url

        return {
          type: 'a',
          ref: undefined,
          constructor: undefined,
          key: undefined,
          props: {
            href: hit.url,
            onClick: (event: MouseEvent) => {
              if (isSpecialClick(event))
                return

              // we rely on the native link scrolling when user is already on
              // the right anchor because Router doesn't support duplicated
              // history entries
              if (route.path === relativeHit)
                return

              // if the hits goes to another page, we prevent the native link
              // behavior to leverage the Router loading feature
              if (route.path !== relativeHit)
                event.preventDefault()

              router.go(relativeHit)
            },
            children,
          },
        }
      },
    }),
  )
}
</script>

<style>
.algolia-search-box {
  padding-top: 1px;
}

@media (min-width: 751px) {
  .algolia-search-box .DocSearch-Button-Placeholder {
    padding-left: 8px;
    font-size: 0.9rem;
    font-weight: 500;
  }
}

.DocSearch {
  --docsearch-container-background: rgba(220,220,220,0.6);
  --docsearch-modal-background: var(--c-bg);
  --docsearch-modal-shadow: var(--c-bg);
  --docsearch-hit-color: var(--c-text-light);
  --docsearch-footer-background: rgba(125,125,125,0.1);
  --docsearch-footer-shadow: rgba(125,125,125,0.1);
  --docsearch-hit-background: rgba(125,125,125,0.1);
  --docsearch-hit-shadow: none;
  --docsearch-primary-color: var(--c-brand);
  --docsearch-highlight-color: var(--docsearch-primary-color);
  --docsearch-searchbox-background: rgba(125,125,125,0.05);
  --docsearch-searchbox-focus-background: rgba(125,125,125,0.05);
  --docsearch-searchbox-shadow: inset 0 0 0 2px var(--docsearch-primary-color);
  --docsearch-text-color: var(--c-text-light);
  --docsearch-muted-color: var(--c-text-lighter);
  --docsearch-key-gradient: rgba(125,125,125,0.1);
  --docsearch-key-shadow: rgba(125,125,125,0.3);
  margin-left: 0.6rem;
  margin-right: -0.2rem;
}

html.dark .DocSearch {
  --docsearch-container-background: rgba(0,0,0,0.8);
}

.DocSearch-Button-Key {
  padding-bottom: 0;
}
</style>
