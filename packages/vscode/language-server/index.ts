import { createConnection, createServer, createSimpleProject } from '@volar/language-server/node'
import { create as createYamlPlugin } from 'volar-service-yaml'
import { slidevLanguagePlugin } from './languagePlugin'

const connection = createConnection()
const server = createServer(connection)

connection.onInitialize((params) => {
  return server.initialize(
    params,
    createSimpleProject([slidevLanguagePlugin]),
    [createYamlPlugin()],
  )
})

connection.onInitialized(server.initialized)

connection.onShutdown(server.shutdown)

connection.listen()
