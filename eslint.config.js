import antfu from '@antfu/eslint-config'

export default antfu(
  {
    overrides: {
      vue: {
        'vue/no-v-text-v-html-on-component': 'off',
        'vue/component-name-in-template-casing': 'off',
      },
    },
    formatters: {
      markdown: true,
      css: true,
      slidev: {
        files: [
          '**/slides.md',
          '**/template.md',
          '**/example.md',
          'test/fixtures/markdown/**/*.md',
        ],
      },
    },
  },
)
