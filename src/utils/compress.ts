/**
 * LZ-String compression/decompression
 * Simplified implementation inspired by LZ-String
 */

const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

/**
 * Compress a string using LZ-based compression
 * @param input - String to compress
 * @returns Compressed string
 */
export function compress(input: string): string {
  if (input === '') return ''

  return compressToBase64(input)
}

/**
 * Decompress a compressed string
 * @param compressed - Compressed string
 * @returns Original string
 */
export function decompress(compressed: string): string {
  if (compressed === '') return ''

  return decompressFromBase64(compressed)
}

/**
 * Compress to Base64
 */
function compressToBase64(input: string): string {
  if (input === '') return ''

  const compressed = lzCompress(input, 6, (a: number) => keyStr.charAt(a))

  // Pad to make it valid base64
  switch (compressed.length % 4) {
    case 1:
      return compressed + '==='
    case 2:
      return compressed + '=='
    case 3:
      return compressed + '='
    default:
      return compressed
  }
}

/**
 * Decompress from Base64
 */
function decompressFromBase64(input: string): string {
  if (input === '') return ''

  return lzDecompress(input.length, 32, (index: number) => {
    return keyStr.indexOf(input.charAt(index))
  })
}

/**
 * Core LZ compression
 */
function lzCompress(
  uncompressed: string,
  bitsPerChar: number,
  getCharFromInt: (val: number) => string
): string {
  let i: number
  let value: number
  const context_dictionary: Record<string, number> = {}
  const context_dictionaryToCreate: Record<string, boolean> = {}
  let context_c = ''
  let context_wc = ''
  let context_w = ''
  let context_enlargeIn = 2
  let context_dictSize = 3
  let context_numBits = 2
  const context_data: string[] = []
  let context_data_val = 0
  let context_data_position = 0

  for (i = 0; i < uncompressed.length; i += 1) {
    context_c = uncompressed.charAt(i)

    if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
      context_dictionary[context_c] = context_dictSize++
      context_dictionaryToCreate[context_c] = true
    }

    context_wc = context_w + context_c

    if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
      context_w = context_wc
    } else {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (let ii = 0; ii < context_numBits; ii++) {
            context_data_val = context_data_val << 1
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
          }
          value = context_w.charCodeAt(0)
          for (let ii = 0; ii < 8; ii++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
            value = value >> 1
          }
        } else {
          value = 1
          for (let ii = 0; ii < context_numBits; ii++) {
            context_data_val = (context_data_val << 1) | value
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
            value = 0
          }
          value = context_w.charCodeAt(0)
          for (let ii = 0; ii < 16; ii++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
            value = value >> 1
          }
        }
        context_enlargeIn--
        if (context_enlargeIn === 0) {
          context_enlargeIn = Math.pow(2, context_numBits)
          context_numBits++
        }
        delete context_dictionaryToCreate[context_w]
      } else {
        value = context_dictionary[context_w]!
        for (let ii = 0; ii < context_numBits; ii++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else {
            context_data_position++
          }
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn === 0) {
        context_enlargeIn = Math.pow(2, context_numBits)
        context_numBits++
      }

      context_dictionary[context_wc] = context_dictSize++
      context_w = String(context_c)
    }
  }

  if (context_w !== '') {
    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
      if (context_w.charCodeAt(0) < 256) {
        for (let ii = 0; ii < context_numBits; ii++) {
          context_data_val = context_data_val << 1
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else {
            context_data_position++
          }
        }
        value = context_w.charCodeAt(0)
        for (let ii = 0; ii < 8; ii++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else {
            context_data_position++
          }
          value = value >> 1
        }
      } else {
        value = 1
        for (let ii = 0; ii < context_numBits; ii++) {
          context_data_val = (context_data_val << 1) | value
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else {
            context_data_position++
          }
          value = 0
        }
        value = context_w.charCodeAt(0)
        for (let ii = 0; ii < 16; ii++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else {
            context_data_position++
          }
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn === 0) {
        context_enlargeIn = Math.pow(2, context_numBits)
        context_numBits++
      }
      delete context_dictionaryToCreate[context_w]
    } else {
      value = context_dictionary[context_w]!
      for (let ii = 0; ii < context_numBits; ii++) {
        context_data_val = (context_data_val << 1) | (value & 1)
        if (context_data_position === bitsPerChar - 1) {
          context_data_position = 0
          context_data.push(getCharFromInt(context_data_val))
          context_data_val = 0
        } else {
          context_data_position++
        }
        value = value >> 1
      }
    }
    context_enlargeIn--
    if (context_enlargeIn === 0) {
      context_enlargeIn = Math.pow(2, context_numBits)
      context_numBits++
    }
  }

  value = 2
  for (let ii = 0; ii < context_numBits; ii++) {
    context_data_val = (context_data_val << 1) | (value & 1)
    if (context_data_position === bitsPerChar - 1) {
      context_data_position = 0
      context_data.push(getCharFromInt(context_data_val))
      context_data_val = 0
    } else {
      context_data_position++
    }
    value = value >> 1
  }

  while (true) {
    context_data_val = context_data_val << 1
    if (context_data_position === bitsPerChar - 1) {
      context_data.push(getCharFromInt(context_data_val))
      break
    } else context_data_position++
  }

  return context_data.join('')
}

/**
 * Core LZ decompression
 */
function lzDecompress(
  length: number,
  resetValue: number,
  getNextValue: (index: number) => number
): string {
  const dictionary: string[] = []
  let enlargeIn = 4
  let dictSize = 4
  let numBits = 3
  let entry = ''
  const result: string[] = []
  let w: string
  let bits: number
  let resb: number
  let maxpower: number
  let power: number
  let c: string | number
  const data = { val: getNextValue(0), position: resetValue, index: 1 }

  for (let i = 0; i < 3; i += 1) {
    dictionary[i] = String(i)
  }

  bits = 0
  maxpower = Math.pow(2, 2)
  power = 1

  while (power !== maxpower) {
    resb = data.val & data.position
    data.position >>= 1
    if (data.position === 0) {
      data.position = resetValue
      data.val = getNextValue(data.index++)
    }
    bits |= (resb > 0 ? 1 : 0) * power
    power <<= 1
  }

  const next = bits
  switch (next) {
    case 0:
      bits = 0
      maxpower = Math.pow(2, 8)
      power = 1
      while (power !== maxpower) {
        resb = data.val & data.position
        data.position >>= 1
        if (data.position === 0) {
          data.position = resetValue
          data.val = getNextValue(data.index++)
        }
        bits |= (resb > 0 ? 1 : 0) * power
        power <<= 1
      }
      c = String.fromCharCode(bits)
      break
    case 1:
      bits = 0
      maxpower = Math.pow(2, 16)
      power = 1
      while (power !== maxpower) {
        resb = data.val & data.position
        data.position >>= 1
        if (data.position === 0) {
          data.position = resetValue
          data.val = getNextValue(data.index++)
        }
        bits |= (resb > 0 ? 1 : 0) * power
        power <<= 1
      }
      c = String.fromCharCode(bits)
      break
    case 2:
      return ''
    default:
      c = ''
  }

  dictionary[3] = c as string
  w = c as string
  result.push(c as string)

  while (true) {
    if (data.index > length) {
      return ''
    }

    bits = 0
    maxpower = Math.pow(2, numBits)
    power = 1
    while (power !== maxpower) {
      resb = data.val & data.position
      data.position >>= 1
      if (data.position === 0) {
        data.position = resetValue
        data.val = getNextValue(data.index++)
      }
      bits |= (resb > 0 ? 1 : 0) * power
      power <<= 1
    }

    const cc = bits
    switch (cc) {
      case 0:
        bits = 0
        maxpower = Math.pow(2, 8)
        power = 1
        while (power !== maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position === 0) {
            data.position = resetValue
            data.val = getNextValue(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }

        dictionary[dictSize++] = String.fromCharCode(bits)
        c = dictSize - 1
        enlargeIn--
        break
      case 1:
        bits = 0
        maxpower = Math.pow(2, 16)
        power = 1
        while (power !== maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position === 0) {
            data.position = resetValue
            data.val = getNextValue(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }
        dictionary[dictSize++] = String.fromCharCode(bits)
        c = dictSize - 1
        enlargeIn--
        break
      case 2:
        return result.join('')
      default:
        c = cc
    }

    if (enlargeIn === 0) {
      enlargeIn = Math.pow(2, numBits)
      numBits++
    }

    if (dictionary[c as number]) {
      entry = dictionary[c as number]!
    } else {
      if (c === dictSize) {
        entry = w + w.charAt(0)
      } else {
        return ''
      }
    }
    result.push(entry)

    dictionary[dictSize++] = w + entry.charAt(0)
    enlargeIn--

    w = entry

    if (enlargeIn === 0) {
      enlargeIn = Math.pow(2, numBits)
      numBits++
    }
  }
}
