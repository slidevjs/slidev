# Custom Print Templates

You can create custom print templates for your documents via custom print templates. To start, create a new file in the `./pages/print` directory, for example, `./pages/print/my-template.vue`.

To print your slides using the custom template, use the `--template` option in the CLI, more details in the [exporting guide](/guide/exporting#print-template).

To debug your print template, you can use the `--print-template` option in dev mode, and access `http://localhost:3030/print?print` to see the print preview.
