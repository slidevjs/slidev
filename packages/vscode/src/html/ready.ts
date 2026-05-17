export type PreviewMode = 'slide' | 'overview'

export function generateReadyHtml(port: number, mode: PreviewMode, hashRoute: boolean, initialSlideNo?: number) {
  const slideNoQuery = initialSlideNo == null ? '' : `&slideNo=${encodeURIComponent(String(initialSlideNo))}`
  const iframeSrc = mode === 'overview'
    ? hashRoute
      ? `http://localhost:${port}?embedded=true#/overview?mode=preview${slideNoQuery}`
      : `http://localhost:${port}/overview?mode=preview&embedded=true${slideNoQuery}`
    : `http://localhost:${port}?embedded=true`
  return `
  <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
    />
    <style>
    :root {
      overflow: hidden;
      --scale: 0.75;
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
    <iframe id="iframe" sandbox="allow-same-origin allow-scripts" src="${iframeSrc}"></iframe>
    <script>
      const vscode = acquireVsCodeApi()
      const iframe = document.getElementById('iframe')
      window.addEventListener('message', ({ data }) => {
        if (data && data.target === 'slidev') {
          if (data.sender === 'vscode')
            iframe.contentWindow.postMessage(data, '*')
          else if (data.type === 'command' || data.type === 'overview-scroll' || data.type === 'open-external')
            vscode.postMessage(data)
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
