import type { SlidevProject } from '../projects'
import { getSlidesTitle } from '../utils/getSlidesTitle'

export function generateErrorHtml(project: SlidevProject | undefined, message: string) {
  const infoText = project
    ? `Slidev server for <i>${getSlidesTitle(project.data)}</i> ${project.port
      ? `not found on <code>http://localhost:${project.port}</code>`
      : `not started`
    }.`
    : `No active project`
  return `
  <head>
    <script>
      const vscode = acquireVsCodeApi()
      window.sendCommand = (command) => void vscode.postMessage({ command })
    </script>
    <style>
    button {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      padding: 8px 12px;
      flex-grow: 1;
    }
    button:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    code {
      font-size: 0.9em;
      font-family: var(--vscode-editor-font-family);
      background: var(--vscode-textBlockQuote-border);
      border-radius: 4px;
      padding: 3px 5px;
      text-wrap: nowrap;
    }
    .action-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: center;
      max-width: 180px;
      margin: 0 auto;
    }
    </style>
  </head>
  <body>
    <div style="text-align: center">
      <p>
        ${infoText}
      </p>
      <p>
        ${message ? `(${message})` : ''}
      </p>
      <p>
        please start the server first.
      </p>
      <div class="action-container">
        ${project?.port ? `<button onclick="sendCommand('start-dev')"> Start Dev Server </button>` : ''}
        <button onclick="sendCommand('config-port')"> Configure Port </button>
      </div>
    </div>
  </body>
  `
}
