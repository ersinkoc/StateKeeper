import { describe, it, expect } from 'vitest'
import { parseShortcut, matchShortcut, matchAnyShortcut, formatShortcut } from '../../../src/utils/keyboard'

describe('parseShortcut', () => {
  it('should parse simple key', () => {
    const def = parseShortcut('z')
    expect(def).toEqual({
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
      key: 'z'
    })
  })

  it('should parse ctrl+z', () => {
    const def = parseShortcut('ctrl+z')
    expect(def).toEqual({
      ctrl: true,
      alt: false,
      shift: false,
      meta: false,
      key: 'z'
    })
  })

  it('should parse cmd+shift+z', () => {
    const def = parseShortcut('cmd+shift+z')
    expect(def).toEqual({
      ctrl: false,
      alt: false,
      shift: true,
      meta: true,
      key: 'z'
    })
  })

  it('should handle control alias', () => {
    const def = parseShortcut('control+z')
    expect(def.ctrl).toBe(true)
  })

  it('should handle option alias', () => {
    const def = parseShortcut('option+z')
    expect(def.alt).toBe(true)
  })

  it('should handle command alias', () => {
    const def = parseShortcut('command+z')
    expect(def.meta).toBe(true)
  })

  it('should handle win alias', () => {
    const def = parseShortcut('win+z')
    expect(def.meta).toBe(true)
  })

  it('should be case insensitive', () => {
    const def1 = parseShortcut('CTRL+Z')
    const def2 = parseShortcut('ctrl+z')
    expect(def1).toEqual(def2)
  })

  it('should parse ctrl+alt+shift+meta+z', () => {
    const def = parseShortcut('ctrl+alt+shift+meta+z')
    expect(def).toEqual({
      ctrl: true,
      alt: true,
      shift: true,
      meta: true,
      key: 'z'
    })
  })
})

describe('matchShortcut', () => {
  it('should match simple key', () => {
    const event = new KeyboardEvent('keydown', { key: 'z' })
    expect(matchShortcut(event, 'z')).toBe(true)
  })

  it('should match ctrl+z', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true
    })
    expect(matchShortcut(event, 'ctrl+z')).toBe(true)
  })

  it('should not match when modifiers are wrong', () => {
    const event = new KeyboardEvent('keydown', { key: 'z' })
    expect(matchShortcut(event, 'ctrl+z')).toBe(false)
  })

  it('should match with definition object', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true
    })
    const def = parseShortcut('ctrl+z')
    expect(matchShortcut(event, def)).toBe(true)
  })

  it('should match cmd+shift+z', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      shiftKey: true
    })
    expect(matchShortcut(event, 'cmd+shift+z')).toBe(true)
  })

  it('should be case insensitive for key', () => {
    const event1 = new KeyboardEvent('keydown', { key: 'Z' })
    const event2 = new KeyboardEvent('keydown', { key: 'z' })

    expect(matchShortcut(event1, 'z')).toBe(true)
    expect(matchShortcut(event2, 'Z')).toBe(true)
  })

  it('should not match when extra modifiers are pressed', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      altKey: true
    })
    expect(matchShortcut(event, 'ctrl+z')).toBe(false)
  })
})

describe('matchAnyShortcut', () => {
  it('should match any of the shortcuts', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true
    })

    expect(matchAnyShortcut(event, ['ctrl+z', 'cmd+z'])).toBe(true)
  })

  it('should return false when none match', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' })

    expect(matchAnyShortcut(event, ['ctrl+z', 'cmd+z'])).toBe(false)
  })

  it('should work with empty array', () => {
    const event = new KeyboardEvent('keydown', { key: 'z' })

    expect(matchAnyShortcut(event, [])).toBe(false)
  })
})

describe('formatShortcut', () => {
  it('should format simple key', () => {
    expect(formatShortcut('z')).toBe('Z')
  })

  it('should format ctrl+z', () => {
    expect(formatShortcut('ctrl+z')).toBe('Ctrl+Z')
  })

  it('should format cmd+shift+z', () => {
    const formatted = formatShortcut('cmd+shift+z')
    expect(formatted).toContain('Shift')
    expect(formatted).toContain('Z')
  })

  it('should format definition object', () => {
    const def = parseShortcut('ctrl+alt+z')
    const formatted = formatShortcut(def)

    expect(formatted).toContain('Ctrl')
    expect(formatted).toContain('Alt')
    expect(formatted).toContain('Z')
  })

  it('should capitalize key', () => {
    expect(formatShortcut('a')).toBe('A')
    expect(formatShortcut('ctrl+a')).toBe('Ctrl+A')
  })
})
