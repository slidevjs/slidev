import { fileURLToPath } from 'node:url'
import { createConnection, createServer, createSimpleProject } from '@volar/language-server/node'
import { create as createYamlService } from './volar-service-yaml'
import { slidevLanguagePlugin } from './languagePlugin'
import { create as createPrettierService } from './prettierService'

const connection = createConnection()
const server = createServer(connection)

connection.onInitialize((params) => {
  return server.initialize(
    params,
    createSimpleProject([slidevLanguagePlugin]),
    [
      createYamlService({
        getLanguageSettings() {
          return {
            completion: true,
            customTags: [],
            format: true,
            hover: true,
            isKubernetes: false,
            validate: true,
            yamlVersion: '1.2',
            schemas: [
              {
                fileMatch: ['volar-embedded-content://frontmatter_0/**/*.md'],
                uri: fileURLToPath(new URL('../schema/headmatter.json', import.meta.url)),
              },
            ],
          }
        },
      }),
      createPrettierService(),
    ],
  )
})

connection.onInitialized(server.initialized)

connection.onShutdown(server.shutdown)

connection.listen()
