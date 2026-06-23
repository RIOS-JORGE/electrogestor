/**
 * Custom hook that detects Web Share API file support and provides
 * a sharePdf function with download/WhatsApp fallback for desktop.
 */

export interface WebShareResult {
  canShare: boolean
  sharePdf: (
    blob: Blob,
    filename: string,
    message: string,
  ) => Promise<{ method: 'share' | 'download' | 'fallback' }>
}

export function useWebShare(): WebShareResult {
  const canShare = checkCanShare()

  const sharePdf = async (
    blob: Blob,
    filename: string,
    message: string,
  ): Promise<{ method: 'share' | 'download' | 'fallback' }> => {
    if (canShare) {
      try {
        const file = new File([blob], filename, { type: 'application/pdf' })
        await navigator.share({ files: [file], title: message })
        return { method: 'share' }
      } catch {
        // Share failed or user cancelled — fall through to download
      }
    }

    // Download fallback
    triggerDownload(blob, filename)

    if (canShare) {
      return { method: 'download' }
    }

    // Open WhatsApp fallback for desktop
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
    return { method: 'fallback' }
  }

  return { canShare, sharePdf }
}

function checkCanShare(): boolean {
  if (typeof navigator.canShare !== 'function') return false
  try {
    const testFile = new File([''], 'test.pdf', { type: 'application/pdf' })
    return !!navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
