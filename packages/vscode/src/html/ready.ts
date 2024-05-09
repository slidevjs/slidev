export function generateReadyHtml(port: number) {
  return `
  <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
    />
    <style>
    :root {
      overflow: hidden;
      --scale: 0.6;
    }
    body {
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: visible;
    }
    iframe {
      border: none;
      width: calc(100% / var(--scale));
      height: calc(100% / var(--scale));
      transform: scale(var(--scale));
      transform-origin: 0 0;
    }
    </style>
  <head>
  <body>
    <iframe id="iframe" sandbox="allow-same-origin allow-scripts" src="http://localhost:${port}?embedded=true"></iframe>
    <script>
      const vscode = acquireVsCodeApi()
      const iframe = document.getElementById('iframe')
      window.addEventListener('message', ({ data }) => {
        if (data && data.target === 'slidev') {
          if (data.sender === 'vscode')
            iframe.contentWindow.postMessage(data, '*')
          else
            vscode.postMessage({
              ...data,
              type: 'update-state',
            })
        }
      })
    </script>
  </body>`
}
