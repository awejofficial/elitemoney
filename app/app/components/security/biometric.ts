const STORAGE_KEY = 'elitemoney.biometricCredential'

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  bytes.forEach(b => (str += String.fromCharCode(b)))
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const str = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='))
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes.buffer
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined')
    return false
  if (!window.PublicKeyCredential)
    return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  }
  catch {
    return false
  }
}

export function hasBiometricCredential(): boolean {
  if (typeof window === 'undefined')
    return false
  return localStorage.getItem(STORAGE_KEY) !== null
}

export async function registerBiometric(userId = 'elitemoney-user', userEmail = 'user@elitemoney.local'): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'EliteMoney' },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userEmail,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null

  if (!credential)
    throw new Error('Could not create biometric credential')

  localStorage.setItem(STORAGE_KEY, toBase64Url(credential.rawId))
}

export async function verifyBiometric(): Promise<boolean> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw)
    return false

  const challenge = crypto.getRandomValues(new Uint8Array(32))

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: fromBase64Url(raw),
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return assertion !== null
  }
  catch {
    return false
  }
}

export function clearBiometricCredential(): void {
  if (typeof window !== 'undefined')
    localStorage.removeItem(STORAGE_KEY)
}
