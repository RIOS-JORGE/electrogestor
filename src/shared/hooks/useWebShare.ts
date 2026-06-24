/**
 * Hook para compartir PDFs por WhatsApp con una cadena de fallback confiable.
 *
 * El problema: generar el PDF (html2canvas + jsPDF) toma 1-3s,
 * y `navigator.share()` requiere un gesto de usuario INMEDIATO.
 * Para cuando el PDF está listo, el gesto expiró → falla en iOS y la mayoría de Android.
 *
 * Solución: descargar el PDF SIEMPRE primero (el archivo queda en el device),
 * luego intentar Web Share, y si falla, abrir WhatsApp con el texto precargado.
 */

export interface WebShareResult {
  canShare: boolean
  sharePdf: (
    blob: Blob,
    filename: string,
    message: string,
  ) => Promise<{ method: 'share' | 'clipboard' }>
}

export function useWebShare(): WebShareResult {
  const sharePdf = async (
    blob: Blob,
    filename: string,
    message: string,
  ): Promise<{ method: 'share' | 'clipboard' }> => {
    // 1. Descargar el PDF SIEMPRE primero — el archivo queda disponible
    triggerDownload(blob, filename)

    // 2. Intentar Web Share API con el archivo
    //    (funciona en algunos Androids incluso post-async)
    if (navigatorCanShareFile()) {
      try {
        const file = new File([blob], filename, { type: 'application/pdf' })
        await navigator.share({ files: [file], title: message, text: message })
        return { method: 'share' }
      } catch {
        // Gesto expirado, usuario canceló, o no soportado — continuar
      }
    }

    // 3. Intentar Web Share solo texto (algunos browsers lo soportan)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: message, text: message })
        return { method: 'share' }
      } catch {
        // Continuar
      }
    }

    // 4. Copiar mensaje al portapapeles
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      // No hay clipboard — continuar igual
    }

    // 5. Abrir WhatsApp (deep link en mobile, web en desktop)
    const encoded = encodeURIComponent(message)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const waUrl = isMobile
      ? `whatsapp://send?text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`

    try {
      window.open(waUrl, '_blank', 'noopener')
    } catch {
      // Popup bloqueado — el usuario ya tiene el PDF descargado
    }

    return { method: 'clipboard' }
  }

  return { canShare: typeof navigator.share === 'function', sharePdf }
}

function navigatorCanShareFile(): boolean {
  if (typeof navigator.canShare !== 'function') return false
  try {
    const testFile = new File([''], 'test.pdf', { type: 'application/pdf' })
    return !!navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  // Usar URL.createObjectURL + anchor es el método más兼容
  // Funciona en iOS (abre el PDF en nueva pestaña, el usuario puede
  // guardarlo o compartirlo desde ahí) y Android (descarga directa)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // No revocar URL inmediatamente — iOS puede necesitarla para mostrar el PDF
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
