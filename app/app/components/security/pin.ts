const STORAGE_KEY = 'elitemoney.pin'

interface StoredPin {
  salt: string
  hash: string
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function digestPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bufferToHex(digest)
}

export function hasPin(): boolean {
  if (typeof window === 'undefined')
    return false
  return localStorage.getItem(STORAGE_KEY) !== null
}

export async function setPin(pin: string): Promise<void> {
  const salt = bufferToHex(crypto.getRandomValues(new Uint8Array(16)).buffer)
  const hash = await digestPin(pin, salt)
  const stored: StoredPin = { salt, hash }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export async function verifyPin(pin: string): Promise<boolean> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw)
    return false
  try {
    const stored: StoredPin = JSON.parse(raw)
    const hash = await digestPin(pin, stored.salt)
    return hash === stored.hash
  }
  catch {
    return false
  }
}

export function clearPin(): void {
  if (typeof window !== 'undefined')
    localStorage.removeItem(STORAGE_KEY)
}
