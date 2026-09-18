const STORAGE_KEY = "app-lock-pin";

type StoredPin = {
  salt: string;
  hash: string;
};

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function digestPin(pin: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

export function hasPin() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function setPin(pin: string) {
  const salt = bufferToHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = await digestPin(pin, salt);
  const stored: StoredPin = { salt, hash };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export async function verifyPin(pin: string) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const stored: StoredPin = JSON.parse(raw);
  const hash = await digestPin(pin, stored.salt);
  return hash === stored.hash;
}

export function clearPin() {
  localStorage.removeItem(STORAGE_KEY);
}
