import { createConnection, createServer, createSimpleProject } from '@volar/language-server/node'
import { slidevLanguagePlugin } from './languagePlugin'
import { create as createPrettierService } from './prettierService'
import { create as createYamlService } from './volar-service-yaml'

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
            format: false,
            hover: true,
            isKubernetes: false,
            validate: true,
            yamlVersion: '1.2',
            parentSkeletonSelectedFirst: false,
            disableDefaultProperties: true,
            schemas: [
              {
                priority: 3,
                fileMatch: ['volar-embedded-content://frontmatter_0/**/*.md'],
                uri: (new URL('../schema/headmatter.json', import.meta.url)).toString(),
              },
              {
                priority: 2,
                fileMatch: ['volar-embedded-content://**/*.md'],
                uri: (new URL('../schema/frontmatter.json', import.meta.url)).toString(),
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
