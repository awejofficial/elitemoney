import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearErrorLogs,
  formatErrorLogsAsText,
  logAppError,
  useErrorLogs,
} from '~/composables/useErrorLogs'

describe('useErrorLogs', () => {
  beforeEach(() => {
    clearErrorLogs()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearErrorLogs()
  })

  it('records an Error object and formats it with source and timestamp', () => {
    const err = new Error('Database connection failed')
    const entry = logAppError('test-source', err, { detailKey: 'val' })

    expect(entry.message).toBe('Database connection failed')
    expect(entry.source).toBe('test-source')
    expect(entry.details).toContain('detailKey')
    expect(entry.stack).toBeDefined()

    const { errorLogs, hasErrors } = useErrorLogs()
    expect(hasErrors.value).toBe(true)
    expect(errorLogs.value.length).toBe(1)
    expect(errorLogs.value[0]?.id).toBe(entry.id)
  })

  it('records string and object errors correctly', () => {
    logAppError('source-string', 'raw string error')
    logAppError('source-obj', { description: 'custom obj description' })

    const { errorLogs } = useErrorLogs()
    expect(errorLogs.value.length).toBe(2)
    expect(errorLogs.value[0]?.message).toBe('raw string error')
    expect(errorLogs.value[1]?.message).toBe('custom obj description')
  })

  it('deduplicates rapid identical messages from the same source', () => {
    const err = new Error('Repeated 500 error')
    const e1 = logAppError('powersync', err)
    const e2 = logAppError('powersync', err)

    const { errorLogs } = useErrorLogs()
    expect(e1.id).toBe(e2.id)
    expect(errorLogs.value.length).toBe(1)
  })

  it('clears error logs properly', () => {
    logAppError('test', 'some error')
    const { clearErrorLogs: clear, errorLogs, hasErrors } = useErrorLogs()
    expect(hasErrors.value).toBe(true)

    clear()
    expect(hasErrors.value).toBe(false)
    expect(errorLogs.value.length).toBe(0)
  })

  it('formats error logs as exportable text', () => {
    logAppError('api', 'endpoint error', 'code 500')
    const text = formatErrorLogsAsText()

    expect(text).toContain('[api] endpoint error')
    expect(text).toContain('Details: code 500')
  })
})
