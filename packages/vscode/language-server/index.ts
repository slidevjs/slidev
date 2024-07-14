import { createConnection, createServer, createSimpleProject } from '@volar/language-server/node'
import { create as createYamlService } from 'volar-service-yaml'
import { slidevLanguagePlugin } from './languagePlugin'
import { create as createPrettierService } from './prettierService'

const connection = createConnection()
const server = createServer(connection)

connection.onInitialize((params) => {
  return server.initialize(
    params,
    createSimpleProject([slidevLanguagePlugin]),
    [createYamlService(), createPrettierService()],
  )
})

connection.onInitialized(server.initialized)

connection.onShutdown(server.shutdown)

connection.listen()
