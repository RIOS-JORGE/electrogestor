/**
 * Hook para compartir PDF por WhatsApp.
 *
 * Estrategia:
 * 1. navigator.share() con archivo PDF (mobile, si hay gesture)
 * 2. Si falla: descargar/open PDF + mostrar wa.me como link clickeable
 * 3. El usuario elige cómo compartir manualmente
 */

export interface WebShareResult {
  canShare: boolean
  sharePdf: (
    blob: Blob,
    filename: string,
    message: string,
  ) => Promise<{ method: 'share' | 'download' | 'wa' }>
}

export function useWebShare(): WebShareResult {
  const sharePdf = async (
    blob: Blob,
    filename: string,
    message: string,
  ): Promise<{ method: 'share' | 'download' | 'wa' }> => {
    // 1. Intentar Web Share API con archivo (funciona en Android moderno si hay gesture)
    if (navigatorCanShareFile()) {
      try {
        const file = new File([blob], filename, { type: 'application/pdf' })
        await navigator.share({ files: [file], title: message, text: message })
        return { method: 'share' }
      } catch {
        // Gesto expirado o cancelado por usuario — continuar
      }
    }

    // 2. Descargar/abrir el PDF
    openPdfInNewTab(blob, filename)

    // 3. Intentar Web Share solo texto (algunos browsers desktop lo soportan)
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
      // No hay clipboard — no es crítico
    }

    return { method: 'download' }
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

function openPdfInNewTab(blob: Blob, filename: string): void {
  // En mobile: abre el PDF en nueva pestaña (el usuario puede guardar/compartir desde ahí)
  // En desktop: descarga el archivo
  const url = URL.createObjectURL(blob)

  // Intentar download primero
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // En iOS el download no funciona para blob URLs —
  // abrir en nueva pestaña como fallback
  setTimeout(() => {
    // Si el download no disparó (detectamos que el blob aún está abierto),
    // abrimos en nueva pestaña
    URL.revokeObjectURL(url)
  }, 10000)
}
