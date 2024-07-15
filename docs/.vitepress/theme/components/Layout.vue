<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { Tooltip } from 'floating-vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-title-after>
      <a @click.prevent>
        <Tooltip :triggers="['hover', 'click']" :popper-triggers="['hover']">
          <Badge class="scale-80 translate-x--1 select-none">
            New Docs
          </Badge>
          <template #popper>
            You are visiting the new Slidev documentation.<br>
            The old one is available
            <a href="https://docs-legacy.sli.dev/" class="underline text-primary">here</a>.
          </template>
        </Tooltip>
      </a>
    </template>
  </Layout>
</template>
