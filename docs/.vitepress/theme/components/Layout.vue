<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { Dropdown } from 'floating-vue'

const { Layout } = DefaultTheme
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
  </Layout>
</template>
