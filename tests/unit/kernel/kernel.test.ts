import { createHistory } from '../../../src/index'

describe('Kernel', () => {
  it('should create with initial state', () => {
    const history = createHistory({ initialState: { count: 0 } })

    expect(history.getState()).toEqual({ count: 0 })
    expect(history.getInitialState()).toEqual({ count: 0 })
  })

  it('should push and undo', () => {
    const history = createHistory({ initialState: { count: 0 } })

    history.push({ count: 1 })
    expect(history.getState()).toEqual({ count: 1 })

    history.undo()
    expect(history.getState()).toEqual({ count: 0 })
  })

  it('should push and redo', () => {
    const history = createHistory({ initialState: { count: 0 } })

    history.push({ count: 1 })
    history.undo()
    history.redo()

    expect(history.getState()).toEqual({ count: 1 })
  })

  it('should check canUndo and canRedo', () => {
    const history = createHistory({ initialState: { count: 0 } })

    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)

    history.push({ count: 1 })
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)

    history.undo()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)
  })

  it('should emit events', () => {
    const history = createHistory({ initialState: { count: 0 } })
    const handler = vi.fn()

    history.on('state-change', handler)
    history.push({ count: 1 })

    expect(handler).toHaveBeenCalled()
  })

  it('should clear history', () => {
    const history = createHistory({ initialState: { count: 0 } })

    history.push({ count: 1 })
    history.push({ count: 2 })
    history.clear()

    expect(history.getState()).toEqual({ count: 0 })
    expect(history.getLength()).toBe(0)
    expect(history.canUndo()).toBe(false)
  })

  it('should get position and length', () => {
    const history = createHistory({ initialState: { count: 0 } })

    expect(history.getPosition()).toBe(-1)
    expect(history.getLength()).toBe(0)

    history.push({ count: 1 })
    expect(history.getPosition()).toBe(0)
    expect(history.getLength()).toBe(1)
  })

  it('should respect limit', () => {
    const history = createHistory({ initialState: { count: 0 }, limit: 2 })

    history.push({ count: 1 })
    history.push({ count: 2 })
    history.push({ count: 3 })

    expect(history.getLength()).toBe(2)
  })

  it('should destroy', () => {
    const history = createHistory({ initialState: { count: 0 } })

    history.destroy()
    expect(history.isDestroyed()).toBe(true)

    expect(() => history.push({ count: 1 })).toThrow()
  })

  it('should set state', () => {
    const history = createHistory({ initialState: { count: 0 } })

    history.setState({ count: 5 })
    expect(history.getState()).toEqual({ count: 5 })
  })

  it('should goTo position', () => {
    const history = createHistory({ initialState: { count: 0 } })

    history.push({ count: 1 })
    history.push({ count: 2 })
    history.push({ count: 3 })

    history.goTo(1)
    expect(history.getState()).toEqual({ count: 2 })
  })

  it('should support command strategy', () => {
    const history = createHistory({
      initialState: { count: 0 },
      strategy: 'command'
    })

    expect(history.getStrategy().name).toBe('command')
  })

  it('should support patch strategy', () => {
    const history = createHistory({
      initialState: { count: 0 },
      strategy: 'patch'
    })

    expect(history.getStrategy().name).toBe('patch')
  })
})
