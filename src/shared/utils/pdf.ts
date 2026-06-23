/**
 * Generates a PDF Blob from a DOM element by capturing it with html2canvas
 * and rendering it with jsPDF. Both libraries are dynamically imported.
 */

export interface GeneratePdfOptions {
  /** The DOM element to capture. Must have rendered content. */
  element: HTMLElement
  /** Optional filename (without .pdf extension). Defaults to 'document'. */
  filename?: string
}

export interface GeneratePdfResult {
  blob: Blob
  url: string
}

export type PdfStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'ready'; result: GeneratePdfResult }
  | { type: 'error'; message: string }

export async function generatePdfBlob(
  element: HTMLElement,
): Promise<GeneratePdfResult> {
  const [html2canvasModule, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvasModule.default(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF('p', 'mm', 'a4')
  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)

  return { blob, url }
}

export function revokePdfUrl(url: string): void {
  URL.revokeObjectURL(url)
}
