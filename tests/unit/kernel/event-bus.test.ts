import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '../../../src/kernel/event-bus'
import type { StateChangeEvent } from '../../../src/types'

describe('EventBus', () => {
  it('should subscribe and emit events', () => {
    const bus = new EventBus<{ count: number }>()
    const handler = vi.fn()

    bus.on('state-change', handler)

    const event: StateChangeEvent<{ count: number }> = {
      type: 'state-change',
      state: { count: 1 },
      prevState: { count: 0 },
      source: 'push',
      timestamp: Date.now()
    }

    bus.emit(event)

    expect(handler).toHaveBeenCalledWith(event)
  })

  it('should return unsubscribe function', () => {
    const bus = new EventBus<unknown>()
    const handler = vi.fn()

    const unsubscribe = bus.on('push', handler)
    unsubscribe()

    bus.emit({ type: 'push', entry: {} as any, state: {}, prevState: {}, timestamp: Date.now() })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should support multiple handlers', () => {
    const bus = new EventBus<unknown>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('clear', handler1)
    bus.on('clear', handler2)

    bus.emit({ type: 'clear', timestamp: Date.now() })

    expect(handler1).toHaveBeenCalled()
    expect(handler2).toHaveBeenCalled()
  })

  it('should handle errors in handlers', () => {
    const bus = new EventBus<unknown>()
    const errorHandler = vi.fn(() => { throw new Error('Handler error') })
    const goodHandler = vi.fn()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    bus.on('clear', errorHandler)
    bus.on('clear', goodHandler)

    bus.emit({ type: 'clear', timestamp: Date.now() })

    expect(errorHandler).toHaveBeenCalled()
    expect(goodHandler).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should clear all handlers', () => {
    const bus = new EventBus<unknown>()
    const handler = vi.fn()

    bus.on('clear', handler)
    bus.clear()
    bus.emit({ type: 'clear', timestamp: Date.now() })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should get handler count', () => {
    const bus = new EventBus<unknown>()

    expect(bus.getHandlerCount('clear')).toBe(0)

    bus.on('clear', vi.fn())
    expect(bus.getHandlerCount('clear')).toBe(1)

    bus.on('clear', vi.fn())
    expect(bus.getHandlerCount('clear')).toBe(2)
  })

  it('should get total handler count', () => {
    const bus = new EventBus<unknown>()

    expect(bus.getTotalHandlerCount()).toBe(0)

    bus.on('clear', vi.fn())
    bus.on('push', vi.fn())
    expect(bus.getTotalHandlerCount()).toBe(2)
  })

  it('should off specific handler', () => {
    const bus = new EventBus<unknown>()
    const handler = vi.fn()

    bus.on('clear', handler)
    bus.off('clear', handler)
    bus.emit({ type: 'clear', timestamp: Date.now() })

    expect(handler).not.toHaveBeenCalled()
  })
})
