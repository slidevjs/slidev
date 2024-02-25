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
      // disable for now, we can enable it after we have the slidev plugin in eslint-config
      markdown: false,
      css: true,
    },
  },
)
