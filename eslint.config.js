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
      slidev: true,
      css: true,
    },
  },
)
