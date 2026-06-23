import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useWebShare } from './useWebShare'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWebShare', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset navigator.canShare and navigator.share to undefined
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    })
  })

  // -----------------------------------------------------------------------
  // Detection
  // -----------------------------------------------------------------------

  it('returns canShare=false when Web Share is not available', () => {
    const { canShare } = useWebShare()
    expect(canShare).toBe(false)
  })

  it('returns canShare=true when canShare supports files', () => {
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => true),
      configurable: true,
    })

    const { canShare } = useWebShare()
    expect(canShare).toBe(true)
  })

  it('returns canShare=false when canShare returns false for files', () => {
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => false),
      configurable: true,
    })

    const { canShare } = useWebShare()
    expect(canShare).toBe(false)
  })

  it('returns canShare=false when canShare throws', () => {
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => {
        throw new Error('not supported')
      }),
      configurable: true,
    })

    const { canShare } = useWebShare()
    expect(canShare).toBe(false)
  })

  // -----------------------------------------------------------------------
  // Share flow
  // -----------------------------------------------------------------------

  it('calls navigator.share when canShare is true', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => true),
      configurable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
    })

    const { sharePdf } = useWebShare()
    const blob = new Blob(['test'], { type: 'application/pdf' })
    const result = await sharePdf(blob, 'report.pdf', 'Quote from ElectroGestor')

    expect(mockShare).toHaveBeenCalledWith({
      files: [expect.any(File)],
      title: 'Quote from ElectroGestor',
    })

    const fileArg = mockShare.mock.calls[0][0].files[0]
    expect(fileArg.name).toBe('report.pdf')
    expect(fileArg.type).toBe('application/pdf')

    expect(result.method).toBe('share')
  })

  it('falls back to download when navigator.share fails', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('AbortError'))
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => true),
      configurable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
    })

    const appendSpy = vi.spyOn(document.body, 'appendChild')

    const { sharePdf } = useWebShare()
    const blob = new Blob(['test'], { type: 'application/pdf' })
    const result = await sharePdf(blob, 'report.pdf', 'Quote')

    expect(appendSpy).toHaveBeenCalled()
    expect(result.method).toBe('download')
  })

  // -----------------------------------------------------------------------
  // Desktop / fallback flow
  // -----------------------------------------------------------------------

  it('triggers download and opens wa.me when canShare is false', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    const { sharePdf } = useWebShare()
    const blob = new Blob(['test'], { type: 'application/pdf' })
    const result = await sharePdf(blob, 'report.pdf', 'Invoice #123 — $450.00')

    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    expect(openSpy).toHaveBeenCalledWith(
      'https://wa.me/?text=Invoice%20%23123%20%E2%80%94%20%24450.00',
      '_blank',
    )
    expect(result.method).toBe('fallback')
  })
})
