/**
 * PDF generation utilities.
 *
 * - generateInvoicePdf: generates a real programmatic PDF for an invoice
 *   (no html2canvas, no DOM capture). Consistent across all devices.
 * - generatePdfBlob: legacy DOM-capture approach (kept for backward compat).
 * - revokePdfUrl: revoke a blob URL.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Invoice } from '../../features/invoicing/types'
import type { Quote } from '../../features/quoting/types'
import type { MaterialItem, LaborItem } from '../../features/quoting/types'

// ── Public types ──────────────────────────────────────────────────────────────

export interface GeneratePdfOptions {
  element: HTMLElement
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

export interface InvoicePdfData {
  invoice: Invoice
  companyName?: string
  mpAlias?: string
  businessName?: string
}

export interface QuotePdfData {
  quote: Quote
  companyName?: string
}

// ── New: programmatic invoice PDF (no html2canvas) ────────────────────────────

export function generateInvoicePdf(data: InvoicePdfData): GeneratePdfResult {
  const { invoice, companyName, mpAlias, businessName } = data

  const doc = new jsPDF('p', 'mm', 'a4')
  const PAGE_WIDTH = 210
  const LM = 20 // left margin
  const RM = 20 // right margin
  const CW = PAGE_WIDTH - LM - RM // content width: 170mm

  const BLUE = '#1e40af'
  const GRAY = '#4b5563'
  const LIGHT = '#9ca3af'
  const DARK = '#111827'
  const RED = '#dc2626'

  // Helper: format date
  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const fmtCurrency = (n: number) => `$${n.toFixed(2)}`

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  let y = 20

  // Company name (left)
  doc.setFontSize(14)
  doc.setTextColor(BLUE)
  doc.setFont('helvetica', 'bold')
  doc.text(companyName || 'ElectroGestor', LM, y)

  // Slogan (left)
  doc.setFontSize(9)
  doc.setTextColor(LIGHT)
  doc.setFont('helvetica', 'normal')
  doc.text('Soluciones eléctricas profesionales', LM, y + 4)

  // FACTURA (right)
  doc.setFontSize(16)
  doc.setTextColor(BLUE)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURA', LM + CW, y, { align: 'right' })

  // Invoice number (right)
  doc.setFontSize(11)
  doc.setTextColor(DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.number, LM + CW, y + 5, { align: 'right' })

  // Date (right)
  doc.setFontSize(10)
  doc.setTextColor(GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtDate(invoice.createdAt), LM + CW, y + 10, { align: 'right' })

  // Header separator line
  y += 16
  doc.setDrawColor(BLUE)
  doc.setLineWidth(0.6)
  doc.line(LM, y, LM + CW, y)
  y += 5

  // ═══════════════════════════════════════════════════════════════════════════
  // DATES ROW
  // ═══════════════════════════════════════════════════════════════════════════

  const dateParts: string[] = []
  if (invoice.issuedAt) dateParts.push(`Emisión: ${fmtDate(invoice.issuedAt)}`)
  if (invoice.dueDate) dateParts.push(`Vencimiento: ${fmtDate(invoice.dueDate)}`)
  if (invoice.paidAt) dateParts.push(`Pago: ${fmtDate(invoice.paidAt)}`)

  if (dateParts.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(GRAY)
    doc.setFont('helvetica', 'normal')
    doc.text(dateParts.join('  |  '), LM, y)
    y += 5
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFontSize(9)
  doc.setTextColor(LIGHT)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', LM, y)
  y += 3.5

  doc.setFontSize(10)
  doc.setTextColor(DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.clientName, LM, y)
  y += 2

  // Separator line
  doc.setDrawColor('#e5e7eb')
  doc.setLineWidth(0.3)
  doc.line(LM, y, LM + CW, y)
  y += 5

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEMS — Materials
  // ═══════════════════════════════════════════════════════════════════════════

  const materials = invoice.items.filter((i): i is MaterialItem => i.type === 'material')
  const labors = invoice.items.filter((i): i is LaborItem => i.type === 'labor')

  if (materials.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(LIGHT)
    doc.setFont('helvetica', 'bold')
    doc.text('MATERIALES', LM, y)
    y += 3

    const matRows = materials.map((item) => [
      `${item.quantity} ${item.unit}`,
      item.description,
      fmtCurrency(item.unitPrice),
      fmtCurrency(item.quantity * item.unitPrice),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Cant.', 'Descripción', 'P. Unit', 'Subtotal']],
      body: matRows,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } },
      headStyles: {
        fillColor: '#f3f4f6',
        textColor: GRAY,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: LM, right: RM },
      tableLineColor: '#e5e7eb',
      tableLineWidth: 0.1,
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEMS — Labor
  // ═══════════════════════════════════════════════════════════════════════════

  if (labors.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(LIGHT)
    doc.setFont('helvetica', 'bold')
    doc.text('MANO DE OBRA', LM, y)
    y += 3

    const laborRows = labors.map((item) => [
      String(item.laborHours),
      item.description,
      fmtCurrency(item.hourlyRate),
      fmtCurrency(item.laborHours * item.hourlyRate),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Hs.', 'Descripción', '$/h', 'Subtotal']],
      body: laborRows,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } },
      headStyles: {
        fillColor: '#f3f4f6',
        textColor: GRAY,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: LM, right: RM },
      tableLineColor: '#e5e7eb',
      tableLineWidth: 0.1,
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTALS
  // ═══════════════════════════════════════════════════════════════════════════

  // Check if we need a new page
  if (y > 240) {
    doc.addPage()
    y = 20
  }

  // Totals box
  const totalsLeft = LM + CW - 80 // right side, 80mm wide
  const totalsWidth = 80
  const ivaAmount = invoice.iva != null ? invoice.subtotal * (invoice.iva / 100) : 0
  const discountAmount = invoice.discount != null ? invoice.subtotal * (invoice.discount / 100) : 0

  // Separator line
  doc.setDrawColor(BLUE)
  doc.setLineWidth(0.6)
  doc.line(totalsLeft, y, totalsLeft + totalsWidth, y)
  y += 4

  // Totals lines
  const totalLines: { label: string; value: string; color?: string; bold?: boolean }[] = [
    { label: 'Subtotal', value: fmtCurrency(invoice.subtotal) },
  ]
  if (invoice.iva != null) {
    totalLines.push({ label: `IVA (${invoice.iva}%)`, value: fmtCurrency(ivaAmount) })
  }
  if (invoice.discount != null && invoice.discount > 0) {
    totalLines.push({ label: `Descuento (${invoice.discount}%)`, value: `-${fmtCurrency(discountAmount)}`, color: RED })
  }
  totalLines.push({ label: 'Total', value: fmtCurrency(invoice.total), bold: true })

  totalLines.forEach((line, i) => {
    const isLast = i === totalLines.length - 1
    doc.setFont('helvetica', line.bold ? 'bold' : 'normal')
    doc.setFontSize(isLast ? 12 : 9)
    doc.setTextColor(line.color ?? GRAY)

    doc.text(line.label, totalsLeft, y)
    doc.text(line.value, totalsLeft + totalsWidth, y, { align: 'right' })
    y += isLast ? 6 : 4
  })

  y += 2

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT INFO
  // ═══════════════════════════════════════════════════════════════════════════

  if (mpAlias) {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    // Payment info box
    doc.setDrawColor('#bfdbfe')
    doc.setFillColor('#eff6ff')
    doc.roundedRect(LM, y, CW, 28, 2, 2, 'FD')
    y += 5

    doc.setFontSize(11)
    doc.setTextColor(BLUE)
    doc.setFont('helvetica', 'bold')
    doc.text('Datos de pago', LM + 6, y)
    y += 5

    doc.setFontSize(9)
    doc.setTextColor('#1d4ed8')
    doc.setFont('helvetica', 'normal')

    let payY = y
    if (businessName) {
      doc.text(`Negocio: ${businessName}`, LM + 6, payY)
      payY += 4
    }
    doc.text(`Alias MP: ${mpAlias}`, LM + 6, payY)
    payY += 4
    doc.text(`Total a transferir: ${fmtCurrency(invoice.total)}`, LM + 6, payY)
    y = y + 18
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════════════════════════════════

  if (invoice.notes) {
    if (y > 255) {
      doc.addPage()
      y = 20
    }

    // Notes separator
    doc.setDrawColor('#e5e7eb')
    doc.setLineWidth(0.3)
    doc.line(LM, y, LM + CW, y)
    y += 5

    doc.setFontSize(9)
    doc.setTextColor(LIGHT)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTAS', LM, y)
    y += 3.5

    doc.setFontSize(9)
    doc.setTextColor(DARK)
    doc.setFont('helvetica', 'normal')

    // Split long notes into multiple lines
    const maxLineWidth = CW - 4
    const noteLines = doc.splitTextToSize(invoice.notes, maxLineWidth)
    doc.text(noteLines, LM, y)
    y += noteLines.length * 4 + 4
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════

  // Push footer to bottom if we have room
  const footerY = Math.max(y + 8, 275)

  doc.setDrawColor('#e5e7eb')
  doc.setLineWidth(0.3)
  doc.line(LM, footerY, LM + CW, footerY)

  doc.setFontSize(8)
  doc.setTextColor(LIGHT)
  doc.setFont('helvetica', 'normal')
  doc.text(`${companyName || 'ElectroGestor'} — Soluciones eléctricas profesionales`, LM + CW / 2, footerY + 4, {
    align: 'center',
  })
  doc.text('Gracias por confiar en nosotros.', LM + CW / 2, footerY + 8, { align: 'center' })

  // ── Output ────────────────────────────────────────────────────────────────
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  return { blob, url }
}

// ── New: programmatic quote PDF (no html2canvas) ─────────────────────────────

export function generateQuotePdf(data: QuotePdfData): GeneratePdfResult {
  const { quote, companyName } = data

  const doc = new jsPDF('p', 'mm', 'a4')
  const PAGE_WIDTH = 210
  const LM = 20
  const RM = 20
  const CW = PAGE_WIDTH - LM - RM

  const BLUE = '#1e40af'
  const GRAY = '#4b5563'
  const LIGHT = '#9ca3af'
  const DARK = '#111827'
  const RED = '#dc2626'

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const fmtCurrency = (n: number) => `$${n.toFixed(2)}`

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  let y = 20

  // Company name (left)
  doc.setFontSize(14)
  doc.setTextColor(BLUE)
  doc.setFont('helvetica', 'bold')
  doc.text(companyName || 'ElectroGestor', LM, y)

  // Slogan (left)
  doc.setFontSize(9)
  doc.setTextColor(LIGHT)
  doc.setFont('helvetica', 'normal')
  doc.text('Soluciones eléctricas profesionales', LM, y + 4)

  // PRESUPUESTO (right)
  doc.setFontSize(16)
  doc.setTextColor(BLUE)
  doc.setFont('helvetica', 'bold')
  doc.text('PRESUPUESTO', LM + CW, y, { align: 'right' })

  // Quote ID (right)
  doc.setFontSize(11)
  doc.setTextColor(DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(`#${quote.id.slice(0, 8).toUpperCase()}`, LM + CW, y + 5, { align: 'right' })

  // Date (right)
  doc.setFontSize(10)
  doc.setTextColor(GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtDate(quote.createdAt), LM + CW, y + 10, { align: 'right' })

  // Header separator
  y += 16
  doc.setDrawColor(BLUE)
  doc.setLineWidth(0.6)
  doc.line(LM, y, LM + CW, y)
  y += 5

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFontSize(9)
  doc.setTextColor(LIGHT)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', LM, y)
  y += 3.5

  doc.setFontSize(10)
  doc.setTextColor(DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(quote.clientName, LM, y)
  y += 2

  // Separator
  doc.setDrawColor('#e5e7eb')
  doc.setLineWidth(0.3)
  doc.line(LM, y, LM + CW, y)
  y += 5

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEMS
  // ═══════════════════════════════════════════════════════════════════════════

  const materials = quote.items.filter((i): i is MaterialItem => i.type === 'material')
  const labors = quote.items.filter((i): i is LaborItem => i.type === 'labor')

  if (materials.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(LIGHT)
    doc.setFont('helvetica', 'bold')
    doc.text('MATERIALES', LM, y)
    y += 3

    const matRows = materials.map((item) => [
      `${item.quantity} ${item.unit}`,
      item.description,
      fmtCurrency(item.unitPrice),
      fmtCurrency(item.quantity * item.unitPrice),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Cant.', 'Descripción', 'P. Unit', 'Subtotal']],
      body: matRows,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } },
      headStyles: {
        fillColor: '#f3f4f6',
        textColor: GRAY,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: LM, right: RM },
      tableLineColor: '#e5e7eb',
      tableLineWidth: 0.1,
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  if (labors.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(LIGHT)
    doc.setFont('helvetica', 'bold')
    doc.text('MANO DE OBRA', LM, y)
    y += 3

    const laborRows = labors.map((item) => [
      String(item.laborHours),
      item.description,
      fmtCurrency(item.hourlyRate),
      fmtCurrency(item.laborHours * item.hourlyRate),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Hs.', 'Descripción', '$/h', 'Subtotal']],
      body: laborRows,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } },
      headStyles: {
        fillColor: '#f3f4f6',
        textColor: GRAY,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: LM, right: RM },
      tableLineColor: '#e5e7eb',
      tableLineWidth: 0.1,
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTALS
  // ═══════════════════════════════════════════════════════════════════════════

  if (y > 240) {
    doc.addPage()
    y = 20
  }

  const totalsLeft = LM + CW - 80
  const totalsWidth = 80
  const ivaAmount = quote.iva != null ? quote.subtotal * (quote.iva / 100) : 0
  const discountAmount = quote.discount != null ? quote.subtotal * (quote.discount / 100) : 0

  doc.setDrawColor(BLUE)
  doc.setLineWidth(0.6)
  doc.line(totalsLeft, y, totalsLeft + totalsWidth, y)
  y += 4

  const totalLines: { label: string; value: string; color?: string; bold?: boolean }[] = [
    { label: 'Subtotal', value: fmtCurrency(quote.subtotal) },
  ]
  if (quote.iva != null) {
    totalLines.push({ label: `IVA (${quote.iva}%)`, value: fmtCurrency(ivaAmount) })
  }
  if (quote.discount != null && quote.discount > 0) {
    totalLines.push({ label: `Descuento (${quote.discount}%)`, value: `-${fmtCurrency(discountAmount)}`, color: RED })
  }
  totalLines.push({ label: 'Total', value: fmtCurrency(quote.total), bold: true })

  totalLines.forEach((line, i) => {
    const isLast = i === totalLines.length - 1
    doc.setFont('helvetica', line.bold ? 'bold' : 'normal')
    doc.setFontSize(isLast ? 12 : 9)
    doc.setTextColor(line.color ?? GRAY)
    doc.text(line.label, totalsLeft, y)
    doc.text(line.value, totalsLeft + totalsWidth, y, { align: 'right' })
    y += isLast ? 6 : 4
  })

  y += 2

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════════════════════════════════

  if (quote.notes) {
    if (y > 255) {
      doc.addPage()
      y = 20
    }

    doc.setDrawColor('#e5e7eb')
    doc.setLineWidth(0.3)
    doc.line(LM, y, LM + CW, y)
    y += 5

    doc.setFontSize(9)
    doc.setTextColor(LIGHT)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTAS', LM, y)
    y += 3.5

    doc.setFontSize(9)
    doc.setTextColor(DARK)
    doc.setFont('helvetica', 'normal')
    const maxLineWidth = CW - 4
    const noteLines = doc.splitTextToSize(quote.notes, maxLineWidth)
    doc.text(noteLines, LM, y)
    y += noteLines.length * 4 + 4
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════

  const footerY = Math.max(y + 8, 275)

  doc.setDrawColor('#e5e7eb')
  doc.setLineWidth(0.3)
  doc.line(LM, footerY, LM + CW, footerY)

  doc.setFontSize(8)
  doc.setTextColor(LIGHT)
  doc.setFont('helvetica', 'normal')
  doc.text(`${companyName || 'ElectroGestor'} — Soluciones eléctricas profesionales`, LM + CW / 2, footerY + 4, {
    align: 'center',
  })
  doc.text('Gracias por confiar en nosotros.', LM + CW / 2, footerY + 8, { align: 'center' })

  // ── Output ────────────────────────────────────────────────────────────────
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  return { blob, url }
}

// ── Legacy: DOM-capture approach (kept for backward compat) ───────────────────

export async function generatePdfBlob(
  element: HTMLElement,
): Promise<GeneratePdfResult> {
  const [html2canvasModule, { jsPDF: JsPdfClass }] = await Promise.all([
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
  const imgWidth = 210
  const pageHeight = 297
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new JsPdfClass('p', 'mm', 'a4')
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
