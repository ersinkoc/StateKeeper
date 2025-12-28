/**
 * Keyboard shortcut parsing and matching
 */

/**
 * Keyboard shortcut definition
 */
export interface ShortcutDefinition {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  key: string
}

/**
 * Parse a shortcut string into a definition
 * @param shortcut - Shortcut string (e.g., "ctrl+z", "cmd+shift+z")
 * @returns Shortcut definition
 */
export function parseShortcut(shortcut: string): ShortcutDefinition {
  const parts = shortcut.toLowerCase().split('+').map((p) => p.trim())

  const definition: ShortcutDefinition = {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    key: '',
  }

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        definition.ctrl = true
        break
      case 'alt':
      case 'option':
        definition.alt = true
        break
      case 'shift':
        definition.shift = true
        break
      case 'meta':
      case 'cmd':
      case 'command':
      case 'win':
        definition.meta = true
        break
      default:
        definition.key = part
    }
  }

  return definition
}

/**
 * Check if a keyboard event matches a shortcut definition
 * @param event - Keyboard event
 * @param shortcut - Shortcut definition or string
 * @returns True if the event matches the shortcut
 */
export function matchShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutDefinition | string
): boolean {
  const definition = typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut

  // Normalize the key
  const eventKey = event.key.toLowerCase()

  // Check modifiers
  if (event.ctrlKey !== definition.ctrl) return false
  if (event.altKey !== definition.alt) return false
  if (event.shiftKey !== definition.shift) return false
  if (event.metaKey !== definition.meta) return false

  // Check key
  return eventKey === definition.key
}

/**
 * Check if an event matches any of the shortcuts
 * @param event - Keyboard event
 * @param shortcuts - Array of shortcut strings
 * @returns True if event matches any shortcut
 */
export function matchAnyShortcut(event: KeyboardEvent, shortcuts: string[]): boolean {
  return shortcuts.some((shortcut) => matchShortcut(event, shortcut))
}

/**
 * Format a shortcut definition as a human-readable string
 * @param definition - Shortcut definition or string
 * @returns Formatted string (e.g., "Ctrl+Z")
 */
export function formatShortcut(definition: ShortcutDefinition | string): string {
  const def = typeof definition === 'string' ? parseShortcut(definition) : definition

  const parts: string[] = []

  if (def.ctrl) parts.push('Ctrl')
  if (def.alt) parts.push('Alt')
  if (def.shift) parts.push('Shift')
  if (def.meta) {
    // Use Cmd on Mac, Win on Windows
    const isMac =
      typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    parts.push(isMac ? 'Cmd' : 'Win')
  }

  parts.push(def.key.toUpperCase())

  return parts.join('+')
}
