import { activeProject, projects } from '../projects'
import { getSlidesTitle } from '../utils/getSlidesTitle'

export function generateErrorHtml(message: string) {
  const project = activeProject.value
  const info = project
    ? `Slidev server for <i>${getSlidesTitle(project.data)}</i> ${project.port
      ? `not found on <code>http://localhost:${project.port}</code>`
      : `not started`
    }.`
    : projects.size
      ? `No active project`
      : `No projects found`
  const errorMessage = message ? `(${message})` : ``
  const instruction = project
    ? project.port
      ? `Please check the server status.`
      : `Please start the server first.`
    : projects.size
      ? `Please choose one first.`
      : `Please add one first.`
  const action = project
    ? project.port
      ? ``
      : `<button onclick="sendCommand('start-dev')"> Start Dev Server </button>`
    : projects.size
      ? `<button onclick="sendCommand('choose-entry')"> Choose active project </button>`
      : `<button onclick="sendCommand('add-entry')"> Add markdown file </button>`
  return `
  <head>
    <script>
      const vscode = acquireVsCodeApi()
      window.sendCommand = (command) => void vscode.postMessage({ type: 'command', command })
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
      <p> ${info} </p>
      <p> ${errorMessage} </p>
      <p> ${instruction} </p>
      <div class="action-container">
        ${action}
        <button onclick="sendCommand('config-port')"> Configure Port </button>
      </div>
    </div>
  </body>
  `
}
