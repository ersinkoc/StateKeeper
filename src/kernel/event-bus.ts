import type { EventType, KernelEvent, EventHandler, Unsubscribe } from '../types'

/**
 * Event bus for kernel events
 */
export class EventBus<T> {
  private handlers: Map<EventType, Set<EventHandler<T>>> = new Map()

  /**
   * Subscribe to an event type
   * @param type - Event type to listen for
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on(type: EventType, handler: EventHandler<T>): Unsubscribe {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }

    const handlers = this.handlers.get(type)!
    handlers.add(handler)

    // Return unsubscribe function
    return () => {
      this.off(type, handler)
    }
  }

  /**
   * Unsubscribe from an event type
   * @param type - Event type
   * @param handler - Event handler to remove
   */
  off(type: EventType, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.delete(handler)

      // Clean up empty sets
      if (handlers.size === 0) {
        this.handlers.delete(type)
      }
    }
  }

  /**
   * Emit an event to all subscribers
   * @param event - Event to emit
   */
  emit(event: KernelEvent<T>): void {
    const handlers = this.handlers.get(event.type)
    if (!handlers) return

    // Execute all handlers
    handlers.forEach((handler) => {
      try {
        handler(event)
      } catch (error) {
        // Log error but don't stop other handlers
        console.error(`[StateKeeper] Error in event handler for ${event.type}:`, error)
      }
    })
  }

  /**
   * Clear all event handlers
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Get number of handlers for a specific event type
   * @param type - Event type
   * @returns Number of handlers
   */
  getHandlerCount(type: EventType): number {
    const handlers = this.handlers.get(type)
    return handlers ? handlers.size : 0
  }

  /**
   * Get total number of handlers across all event types
   * @returns Total handler count
   */
  getTotalHandlerCount(): number {
    let count = 0
    this.handlers.forEach((handlers) => {
      count += handlers.size
    })
    return count
  }
}
