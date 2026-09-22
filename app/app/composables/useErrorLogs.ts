import { computed, readonly, ref } from 'vue'

export type AppErrorEntry = {
  details?: string
  id: string
  message: string
  source: string
  stack?: string
  timestamp: number
}

const STORAGE_KEY = 'finapp.error_logs'
const MAX_LOGS = 100

const errorLogs = ref<AppErrorEntry[]>([])
let _initialized = false

function loadStoredLogs(): void {
  if (_initialized || !import.meta.client)
    return
  _initialized = true
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed))
        errorLogs.value = parsed.slice(-MAX_LOGS)
    }
  }
  catch {
    // Ignore storage parse errors
  }
}

function persistLogs(): void {
  if (!import.meta.client)
    return
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(errorLogs.value.slice(-MAX_LOGS)))
  }
  catch {
    // Storage quota or disabled
  }
}

/**
 * Centrally records an application error:
 * 1. Formats and prints to console.error so it appears in browser DevTools error logs.
 * 2. Persists to an in-app error ring buffer for troubleshooting and diagnostics UI.
 */
export function logAppError(source: string, error: unknown, details?: unknown): AppErrorEntry {
  loadStoredLogs()

  const timestamp = Date.now()
  const id = `${timestamp}-${Math.random().toString(36).slice(2, 7)}`

  let message = 'Unknown error'
  let stack: string | undefined
  let detailsStr: string | undefined

  if (error instanceof Error) {
    message = error.message || error.name
    stack = error.stack
  }
  else if (typeof error === 'string') {
    message = error
  }
  else if (error && typeof error === 'object') {
    try {
      message = (error as any).message || (error as any).description || JSON.stringify(error)
    }
    catch {
      message = String(error)
    }
  }

  if (details !== undefined) {
    try {
      detailsStr = typeof details === 'string' ? details : JSON.stringify(details)
    }
    catch {
      detailsStr = String(details)
    }
  }

  const entry: AppErrorEntry = {
    details: detailsStr,
    id,
    message,
    source,
    stack,
    timestamp,
  }

  // Deduplicate if the exact same source and message was logged within the last 2 seconds
  const last = errorLogs.value[errorLogs.value.length - 1]
  if (last && last.source === source && last.message === message && timestamp - last.timestamp < 2000) {
    return last
  }

  errorLogs.value = [...errorLogs.value.slice(-(MAX_LOGS - 1)), entry]
  persistLogs()

  // Format visibly in the DevTools console
  console.error(`[EliteMoney Error] [${source}]`, message, {
    details,
    error,
    timestamp: new Date(timestamp).toISOString(),
  })

  return entry
}

export function clearErrorLogs(): void {
  errorLogs.value = []
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY)
  }
  catch {}
}

export function formatErrorLogsAsText(): string {
  loadStoredLogs()
  if (!errorLogs.value.length)
    return 'No error logs recorded.'

  return errorLogs.value
    .map((e) => {
      const time = new Date(e.timestamp).toISOString()
      let out = `[${time}] [${e.source}] ${e.message}`
      if (e.details)
        out += `\n  Details: ${e.details}`
      if (e.stack)
        out += `\n  Stack: ${e.stack}`
      return out
    })
    .join('\n---\n')
}

export function useErrorLogs() {
  loadStoredLogs()

  return {
    clearErrorLogs,
    errorLogs: readonly(errorLogs),
    formatErrorLogsAsText,
    hasErrors: computed(() => errorLogs.value.length > 0),
    latestError: computed(() => errorLogs.value[errorLogs.value.length - 1] ?? null),
    logAppError,
  }
}
