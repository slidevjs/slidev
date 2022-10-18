<template>
  <div id="docsearch" class="algolia-search-box" />
</template>

<script setup lang="ts">
import '@docsearch/css'
import docsearch from '@docsearch/js'
import { onMounted } from 'vue'
import { useRouter, useRoute, useData } from 'vitepress'

const router = useRouter()
const route = useRoute()
const { theme, site } = useData()

onMounted(() => {
  initialize(theme.value.algolia)
  setTimeout(poll, 16)
})

function poll() {
  // programmatically open the search box after initialize
  const e = new Event('keydown') as any

  e.key = 'k'
  e.metaKey = true

  window.dispatchEvent(e)

  setTimeout(() => {
    if (!document.querySelector('.DocSearch-Modal')) {
      poll()
    }
  }, 16)
}

// @ts-expect-error
const docsearch$ = docsearch.default ?? docsearch
type DocSearchProps = Parameters<typeof docsearch$>[0]

function initialize(userOptions: any) {
  // note: multi-lang search support is removed since the theme
  // doesn't support multiple locales as of now.
  const options = Object.assign<{}, {}, DocSearchProps>({}, userOptions, {
    container: '#docsearch',

    navigator: {
      navigate({ itemUrl }: any) {
        const { pathname: hitPathname } = new URL(
          window.location.origin + itemUrl
        )

        // router doesn't handle same-page navigation so we use the native
        // browser location API for anchor navigation
        if (route.path === hitPathname) {
          window.location.assign(window.location.origin + itemUrl)
        } else {
          router.go(itemUrl)
        }
      }
    },

    transformItems(items: any) {
      return items.map((item: any) => {
        return Object.assign({}, item, {
          url: getRelativePath(item.url)
        })
      })
    },

    // @ts-expect-error vue-tsc thinks this should return Vue JSX but it returns the required React one
    hitComponent({ hit, children }) {
      return {
        __v: null,
        type: 'a',
        ref: undefined,
        constructor: undefined,
        key: undefined,
        props: { href: hit.url, children }
      }
    }
  })

  docsearch$(options)
}

function getRelativePath(absoluteUrl: string) {
  const { pathname, hash } = new URL(absoluteUrl)
  return (
    pathname.replace(
      /\.html$/,
      // @ts-expect-error
      site.value.cleanUrls === 'disabled' ? '.html' : ''
    ) + hash
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
