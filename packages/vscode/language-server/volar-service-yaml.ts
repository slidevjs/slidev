// Vendored from https://github.com/volarjs/services/tree/master/packages/yaml
// Await https://github.com/volarjs/services/pull/103

import type { Disposable, DocumentSelector, LanguageServiceContext, LanguageServicePlugin, LanguageServicePluginInstance, ProviderResult } from '@volar/language-service'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { URI, Utils } from 'vscode-uri'
import * as yaml from 'yaml-language-server'

export interface Provide {
  'yaml/languageService': () => yaml.LanguageService
}

function noop(): undefined { }

/**
 * Create a Volar language service for YAML documents.
 */
export function create({
  documentSelector = ['yaml'],
  getWorkspaceContextService = (context) => {
    return {
      resolveRelativePath(relativePath, resource) {
        const base = resource.substring(0, resource.lastIndexOf('/') + 1)
        let baseUri = URI.parse(base)
        const decoded = context.decodeEmbeddedDocumentUri(baseUri)
        if (decoded) {
          baseUri = decoded[0]
        }
        return Utils.resolvePath(baseUri, relativePath).toString()
      },
    }
  },
  getLanguageSettings = () => {
    return {
      completion: true,
      customTags: [],
      format: true,
      hover: true,
      isKubernetes: false,
      validate: true,
      yamlVersion: '1.2',
    }
  },
  onDidChangeLanguageSettings = () => {
    return { dispose() { } }
  },
}: {
  documentSelector?: DocumentSelector
  getWorkspaceContextService?: (context: LanguageServiceContext) => yaml.WorkspaceContextService
  getLanguageSettings?: (context: LanguageServiceContext) => ProviderResult<yaml.LanguageSettings>
  onDidChangeLanguageSettings?: (listener: () => void, context: LanguageServiceContext) => Disposable
} = {}): LanguageServicePlugin {
  return {
    name: 'yaml',
    capabilities: {
      codeActionProvider: {},
      codeLensProvider: {
        resolveProvider: false,
      },
      completionProvider: {
        triggerCharacters: [' ', ':'],
      },
      definitionProvider: true,
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: false,
      },
      documentOnTypeFormattingProvider: {
        triggerCharacters: ['\n'],
      },
      documentSymbolProvider: true,
      hoverProvider: true,
      documentLinkProvider: {},
      foldingRangeProvider: true,
      selectionRangeProvider: true,
    },
    create(context): LanguageServicePluginInstance<Provide> {
      const ls = yaml.getLanguageService({
        schemaRequestService: async uri => await context.env.fs?.readFile(URI.parse(uri)) ?? '',
        telemetry: {
          send: noop,
          sendError: noop,
          sendTrack: noop,
        },
        // @ts-expect-error https://github.com/redhat-developer/yaml-language-server/pull/910
        clientCapabilities: context.env?.clientCapabilities,
        workspaceContext: getWorkspaceContextService(context),
      })
      let initializing: Promise<void> | undefined

      const disposable = onDidChangeLanguageSettings(() => initializing = undefined, context)

      return {
        dispose() {
          disposable.dispose()
        },

        provide: {
          'yaml/languageService': () => ls,
        },

        provideCodeActions(document, range, context) {
          return worker(document, () => {
            return ls.getCodeAction(document, {
              context,
              range,
              textDocument: document,
            })
          })
        },

        // provideCodeLenses(document) {
        //   return worker(document, () => {
        //     return ls.getCodeLens(document)
        //   })
        // },

        provideCompletionItems(document, position) {
          return worker(document, () => {
            return ls.doComplete(document, position, false)
          })
        },

        provideDefinition(document, position) {
          return worker(document, () => {
            return ls.doDefinition(document, { position, textDocument: document })
          })
        },

        provideDiagnostics(document) {
          return worker(document, () => {
            return ls.doValidation(document, false)
          })
        },

        provideDocumentSymbols(document) {
          return worker(document, () => {
            return ls.findDocumentSymbols2(document, {})
          })
        },

        provideHover(document, position) {
          return worker(document, () => {
            return ls.doHover(document, position)
          })
        },

        provideDocumentLinks(document) {
          return worker(document, () => {
            return ls.findLinks(document)
          })
        },

        provideFoldingRanges(document) {
          return worker(document, () => {
            return ls.getFoldingRanges(document, context.env.clientCapabilities?.textDocument?.foldingRange ?? {})
          })
        },

        provideOnTypeFormattingEdits(document, position, key, options) {
          return worker(document, () => {
            return ls.doDocumentOnTypeFormatting(document, { ch: key, options, position, textDocument: document })
          })
        },

        provideSelectionRanges(document, positions) {
          return worker(document, () => {
            return ls.getSelectionRanges(document, positions)
          })
        },

        // resolveCodeLens(codeLens) {
        //   return ls.resolveCodeLens(codeLens)
        // },
      }

      async function worker<T>(document: TextDocument, callback: () => T): Promise<Awaited<T> | undefined> {
        if (!matchDocument(documentSelector, document)) {
          return
        }

        await (initializing ??= initialize())

        return await callback()
      }

      async function initialize() {
        const settings = await getLanguageSettings(context)
        ls.configure(settings)
      }
    },
  }
}

function matchDocument(selector: DocumentSelector, document: TextDocument) {
  for (const sel of selector) {
    if (sel === document.languageId || (typeof sel === 'object' && sel.language === document.languageId)) {
      return true
    }
  }
  return false
}
