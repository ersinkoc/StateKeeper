/**
 * Utility functions for StateKeeper
 * @packageDocumentation
 */

export { uid } from './uid'
export { deepClone } from './deep-clone'
export { deepEqual } from './deep-equal'
export { diff, escapeKey, unescapeKey, parsePath } from './diff'
export {
  applyPatch,
  createInversePatch,
  createInversePatches,
} from './patch'
export { compress, decompress } from './compress'
export {
  parseShortcut,
  matchShortcut,
  matchAnyShortcut,
  formatShortcut,
  type ShortcutDefinition,
} from './keyboard'
