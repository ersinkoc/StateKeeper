import { describe, it, expect } from 'vitest'
import { compress, decompress } from '../../../src/utils/compress'

describe('compress and decompress', () => {
  it('should compress and decompress simple string', () => {
    const input = 'Hello, World!'
    const compressed = compress(input)
    const decompressed = decompress(compressed)

    expect(decompressed).toBe(input)
  })

  it('should compress and decompress empty string', () => {
    const input = ''
    const compressed = compress(input)
    const decompressed = decompress(compressed)

    expect(compressed).toBe('')
    expect(decompressed).toBe('')
  })

  it('should compress and decompress JSON', () => {
    const input = JSON.stringify({ name: 'John', age: 30, items: [1, 2, 3] })
    const compressed = compress(input)
    const decompressed = decompress(compressed)

    expect(decompressed).toBe(input)
    // Small data might not compress smaller due to overhead
    expect(compressed).toBeTruthy()
  })

  it('should compress repetitive data efficiently', () => {
    const input = 'aaaaaaaaaa'.repeat(100)
    const compressed = compress(input)
    const decompressed = decompress(compressed)

    expect(decompressed).toBe(input)
    expect(compressed.length).toBeLessThan(input.length)
  })

  it('should handle unicode characters', () => {
    const input = 'こんにちは世界 🌍 émojis'
    const compressed = compress(input)
    const decompressed = decompress(compressed)

    expect(decompressed).toBe(input)
  })

  it('should handle large JSON objects', () => {
    const input = JSON.stringify({
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 2 === 0
      }))
    })

    const compressed = compress(input)
    const decompressed = decompress(compressed)

    expect(decompressed).toBe(input)
    expect(compressed.length).toBeLessThan(input.length)
  })

  it('should handle special characters', () => {
    const input = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
    const compressed = compress(input)
    const decompressed = decompress(compressed)

    expect(decompressed).toBe(input)
  })

  it('should compress data multiple times consistently', () => {
    const input = 'Test data for compression'
    const compressed1 = compress(input)
    const compressed2 = compress(input)

    // Compression should be deterministic
    expect(compressed1).toBe(compressed2)
  })
})
