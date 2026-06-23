import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generatePdfBlob, revokePdfUrl } from './pdf'

// ---------------------------------------------------------------------------
// Hoisted mock factories — run before vi.mock so the module factories capture
// the references. This lets us assert on the same mock instances in tests.
//
// jsPDF is called with `new` in the source, so the mock implementation must
// be a regular function (not an arrow) to support constructor invocation.
// ---------------------------------------------------------------------------

const { mockHtml2canvas, mockJsPDF, mockAddImage, mockAddPage } =
  vi.hoisted(() => {
    const addImage = vi.fn()
    const addPage = vi.fn()
    const output = vi.fn(() => new Blob(['pdf-content'], { type: 'application/pdf' }))

    return {
      mockHtml2canvas: vi.fn(),
      mockJsPDF: vi.fn(function () {
        return { addImage, addPage, output }
      }),
      mockAddImage: addImage,
      mockAddPage: addPage,
    }
  })

vi.mock('html2canvas', () => ({
  default: mockHtml2canvas,
}))

vi.mock('jspdf', () => ({
  jsPDF: mockJsPDF,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockCanvas(overrides?: Partial<HTMLCanvasElement>): HTMLCanvasElement {
  return {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,mockimage'),
    ...overrides,
  } as unknown as HTMLCanvasElement
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generatePdfBlob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHtml2canvas.mockResolvedValue(createMockCanvas())
  })

  it('calls html2canvas with the element and capture options', async () => {
    const element = document.createElement('div')
    await generatePdfBlob(element)

    expect(mockHtml2canvas).toHaveBeenCalledWith(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
  })

  it('creates a jsPDF instance with portrait A4', async () => {
    const element = document.createElement('div')
    await generatePdfBlob(element)

    expect(mockJsPDF).toHaveBeenCalledWith('p', 'mm', 'a4')
  })

  it('adds the captured image to the PDF', async () => {
    const element = document.createElement('div')
    await generatePdfBlob(element)

    expect(mockAddImage).toHaveBeenCalled()
  })

  it('returns a Blob and an object URL', async () => {
    const element = document.createElement('div')
    const result = await generatePdfBlob(element)

    expect(result.blob).toBeInstanceOf(Blob)
    expect(typeof result.url).toBe('string')
    expect(result.url.startsWith('blob:')).toBe(true)
  })

  it('handles multi-page content when the canvas is taller than A4', async () => {
    mockHtml2canvas.mockResolvedValueOnce(createMockCanvas({ height: 3000 }))

    const element = document.createElement('div')
    await generatePdfBlob(element)

    // Height 3000px at 210mm width → imgHeight ≈ 787.5mm
    // A4 is 297mm → needs 3 pages → addPage called for pages 2 and 3
    expect(mockAddPage).toHaveBeenCalledTimes(2)
  })

  it('throws when html2canvas fails', async () => {
    mockHtml2canvas.mockRejectedValueOnce(new Error('html2canvas error'))

    const element = document.createElement('div')
    await expect(generatePdfBlob(element)).rejects.toThrow('html2canvas error')
  })
})

describe('revokePdfUrl', () => {
  it('calls URL.revokeObjectURL with the given url', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    revokePdfUrl('blob:http://localhost/test')

    expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/test')
  })
})
