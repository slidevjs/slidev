<script setup lang="ts">
import { Dropdown } from 'floating-vue'
import { useRoute } from 'vitepress'
import VPMenuLink from 'vitepress/dist/client/theme-default/components/VPMenuLink.vue'
import DefaultTheme from 'vitepress/theme'
import FeatureTag from './FeatureTag.vue'

const { Layout } = DefaultTheme
const route = useRoute()
</script>

<template>
  <Layout>
    <template #nav-bar-title-after>
      <a @click.prevent>
        <Dropdown :triggers="['hover', 'click']" :popper-triggers="['hover']" theme="twoslash" popper-class="z-1000">
          <Badge class="scale-80 translate-x--1 select-none">
            New Docs!
          </Badge>
          <template #popper>
            <div class="p3 text-sm">
              <p>
                You are viewing the new Slidev documentation.
              </p>
              <p>
                The old one is available
                <a href="https://docs-legacy.sli.dev/" class="underline text-primary" target="_blank">here</a>.
              </p>
            </div>
          </template>
        </Dropdown>
      </a>
    </template>
    <template #sidebar-nav-after>
      <div flex="~ col gap-2">
        <div v-if="route.data?.frontmatter?.tags" class="bg-$vp-c-bg-soft p4 rounded-lg" flex="~ col gap-2">
          <div font-bold text-sm op75>
            Tags
          </div>
          <div flex="~ wrap gap-2">
            <FeatureTag v-for="tag in route.data.frontmatter.tags" :key="tag" :tag="tag" />
          </div>
        </div>
        <div v-if="route.data?.frontmatter?.since" class="bg-$vp-c-bg-soft px2 pb2 rounded-lg" flex="~ col gap-1">
          <div font-bold text-sm op75 px2 pt4>
            Since
          </div>
          <VPMenuLink
            :item="{
              text: route.data.frontmatter.since,
              link: `https://github.com/slidevjs/slidev/releases/tag/${route.data.frontmatter.since}`,
            }"
          />
        </div>
      </div>
    </template>
  </Layout>
</template>
