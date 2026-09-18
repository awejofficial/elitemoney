const STORAGE_KEY = "app-lock-credential-id";

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const str = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}

export async function isBiometricAvailable() {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function hasBiometricCredential() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function registerBiometric(userId: string, userEmail: string) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Expense & Income Tracker" },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userEmail,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Could not create biometric credential");

  localStorage.setItem(STORAGE_KEY, toBase64Url(credential.rawId));
}

export async function verifyBiometric() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        { type: "public-key", id: fromBase64Url(raw) },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  });

  return assertion !== null;
}

export function clearBiometricCredential() {
  localStorage.removeItem(STORAGE_KEY);
}
