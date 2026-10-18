import { describe, expect, it } from 'vitest'
import { INITIAL_LOAD_STATE, loadFailed, loadSucceeded } from './loadState'

describe('loadFailed', () => {
  it('turns a failed first load into an error the user can retry', () => {
    expect(loadFailed(INITIAL_LOAD_STATE, 'offline')).toEqual({ state: { status: 'error', error: 'offline' }, notify: false })
  })

  it('keeps showing loaded data when a background re-sync fails', () => {
    const ready = loadSucceeded()
    const { state, notify } = loadFailed(ready, 'offline')
    expect(state).toBe(ready)
    expect(notify).toBe(true)
  })

  it('stays an error when a retry after a failed first load also fails', () => {
    const first = loadFailed(INITIAL_LOAD_STATE, 'offline').state
    expect(loadFailed(first, 'still offline')).toEqual({ state: { status: 'error', error: 'still offline' }, notify: false })
  })
})
