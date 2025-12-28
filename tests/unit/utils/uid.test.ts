import { uid } from '../../../src/utils/uid'

describe('uid', () => {
  it('should generate a unique ID', () => {
    const id1 = uid()
    const id2 = uid()

    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
  })

  it('should use crypto.randomUUID when available', () => {
    const mockUUID = '123e4567-e89b-12d3-a456-426614174000'
    const mockCrypto = {
      randomUUID: vi.fn(() => mockUUID)
    }

    vi.stubGlobal('crypto', mockCrypto)

    const id = uid()

    expect(id).toBe(mockUUID)
    expect(mockCrypto.randomUUID).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('should fallback to timestamp + random when crypto.randomUUID is not available', () => {
    vi.stubGlobal('crypto', undefined)

    const id = uid()

    expect(id).toBeTruthy()
    expect(id).toContain('-')

    vi.unstubAllGlobals()
  })

  it('should generate different IDs on multiple calls', () => {
    const ids = new Set()

    for (let i = 0; i < 100; i++) {
      ids.add(uid())
    }

    expect(ids.size).toBe(100)
  })
})
