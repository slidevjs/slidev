<template>
  <footer v-if="$frontmatter.footer" class="footer">
    <div class="container">
      <p class="text">
        {{ $frontmatter.footer }}
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin: 0 auto;
  max-width: 960px;
}

@media (min-width: 720px) {
  .footer {
    padding: 0 1.5rem;
  }
}

.container {
  padding: 2rem 1.5rem 2.25rem;
}

@media (min-width: 420px) {
  .container {
    padding: 3rem 1.5rem 3.25rem;
  }
}

.text {
  margin: 0;
  text-align: center;
  line-height: 1.4;
  font-size: .9rem;
  color: var(--c-text-light);
}
</style>
