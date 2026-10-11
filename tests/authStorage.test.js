import test from 'node:test'
import assert from 'node:assert/strict'
import { authStorage, rememberSession } from '../src/lib/authStorage.js'

test('remember-me preserves old sessions and controls where new tokens persist', () => {
  const storage = () => {
    const values = new Map()
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    }
  }
  globalThis.localStorage = storage()
  globalThis.sessionStorage = storage()
  localStorage.setItem('auth-token', 'old-session')
  assert.equal(authStorage.getItem('auth-token'), 'old-session')
  rememberSession(false)
  authStorage.setItem('auth-token', 'temporary-session')
  assert.equal(localStorage.getItem('auth-token'), null)
  assert.equal(sessionStorage.getItem('auth-token'), 'temporary-session')
  rememberSession(true)
  authStorage.setItem('auth-token', 'remembered-session')
  assert.equal(sessionStorage.getItem('auth-token'), null)
  assert.equal(localStorage.getItem('auth-token'), 'remembered-session')
  authStorage.removeItem('auth-token')
  assert.equal(authStorage.getItem('auth-token'), null)
})
