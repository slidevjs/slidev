import { createTypstCompiler } from 'typst.ts'

// Initialize Typst compiler
export async function setupTypst() {
  const compiler = await createTypstCompiler({
    // Configure Typst compiler options here
    getModule: () => fetch('https://cdn.jsdelivr.net/npm/@typst.ts/compiler@latest/dist/assets/typst_wasm_bg.wasm')
      .then(response => response.arrayBuffer())
      .then(buffer => new WebAssembly.Module(buffer)),
  })

  return compiler
}

// Singleton instance
let typstCompilerPromise: Promise<any> | null = null

export function getTypstCompiler() {
  if (!typstCompilerPromise)
    typstCompilerPromise = setupTypst()
  
  return typstCompilerPromise
}

// Render Typst formula to SVG
export async function renderTypstFormula(formula: string, displayMode = false): Promise<string> {
  try {
    const compiler = await getTypstCompiler()
    
    // Create a simple Typst document with just the math formula
    const typstCode = displayMode 
      ? `#set page(width: auto, height: auto, margin: 0pt)\n#set text(font: "Latin Modern Math")\n$ ${formula} $`
      : `#set page(width: auto, height: auto, margin: 0pt)\n#set text(font: "Latin Modern Math")\n$${formula}$`
    
    // Compile and render to SVG
    const svg = await compiler.renderToSvg(typstCode)
    return svg
  }
  catch (error) {
    console.error('Error rendering Typst formula:', error)
    return `<span class="typst-error">${formula}</span>`
  }
}