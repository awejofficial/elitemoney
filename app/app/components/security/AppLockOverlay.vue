<script setup lang="ts">
import { hasPin, verifyPin } from '~/components/security/pin'
import { hasBiometricCredential, verifyBiometric } from '~/components/security/biometric'

const isLocked = ref(false)
const pinInput = ref('')
const errorMessage = ref('')
const isBiometricSupported = ref(false)

const RELOCK_AFTER_MS = 30_000
let hiddenAt: number | null = null

function checkLock() {
  if (import.meta.server)
    return
  if (hasPin()) {
    isLocked.value = true
    isBiometricSupported.value = hasBiometricCredential()
    if (isBiometricSupported.value)
      triggerBiometricUnlock()
  }
  else {
    isLocked.value = false
  }
}

async function triggerBiometricUnlock() {
  errorMessage.value = ''
  try {
    const success = await verifyBiometric()
    if (success) {
      isLocked.value = false
      pinInput.value = ''
    }
  }
  catch {
    // Fall back to PIN
  }
}

async function handleDigit(digit: string) {
  if (pinInput.value.length >= 6)
    return

  pinInput.value += digit
  errorMessage.value = ''

  if (pinInput.value.length >= 4) {
    const ok = await verifyPin(pinInput.value)
    if (ok) {
      isLocked.value = false
      pinInput.value = ''
      errorMessage.value = ''
    }
    else if (pinInput.value.length === 6) {
      errorMessage.value = 'Incorrect PIN'
      setTimeout(() => {
        pinInput.value = ''
      }, 400)
    }
  }
}

function handleBackspace() {
  pinInput.value = pinInput.value.slice(0, -1)
  errorMessage.value = ''
}

function handleClear() {
  pinInput.value = ''
  errorMessage.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (!isLocked.value)
    return
  if (/^[0-9]$/.test(e.key)) {
    handleDigit(e.key)
  }
  else if (e.key === 'Backspace') {
    handleBackspace()
  }
  else if (e.key === 'Escape') {
    handleClear()
  }
}

onMounted(() => {
  checkLock()
  window.addEventListener('keydown', onKeydown)

  document.addEventListener('visibilitychange', () => {
    if (!hasPin())
      return
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now()
    }
    else if (hiddenAt !== null) {
      const elapsed = Date.now() - hiddenAt
      hiddenAt = null
      if (elapsed >= RELOCK_AFTER_MS)
        isLocked.value = true
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

defineExpose({
  checkLock,
  lockNow: () => {
    if (hasPin())
      isLocked.value = true
  },
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isLocked"
      class="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-neutral-950/95 p-4 text-white backdrop-blur-2xl select-none"
    >
      <!-- Brand & Lock Icon -->
      <div class="flex flex-col items-center gap-3 pb-8">
        <div class="flex size-16 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-lg ring-1 ring-primary/30">
          <UIcon name="i-lucide-lock" class="size-8" />
        </div>
        <div class="text-center">
          <h2 class="text-xl font-bold font-brand tracking-wide text-white">
            EliteMoney
          </h2>
          <p class="text-xs text-neutral-400 pt-1">
            Enter your PIN to unlock
          </p>
        </div>
      </div>

      <!-- PIN Dots Indicator -->
      <div class="flex items-center justify-center gap-3 pb-6">
        <div
          v-for="i in 4"
          :key="i"
          class="size-3.5 rounded-full border-2 border-primary/50 transition-all duration-200"
          :class="pinInput.length >= i ? 'bg-primary scale-110 border-primary' : 'bg-transparent'"
        />
      </div>

      <!-- Error message -->
      <div class="h-6 text-center text-xs font-medium text-rose-500 pb-2">
        {{ errorMessage }}
      </div>

      <!-- Numeric Keypad -->
      <div class="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        <button
          v-for="n in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
          :key="n"
          type="button"
          class="flex size-18 items-center justify-center rounded-2xl bg-neutral-900/80 text-2xl font-semibold text-neutral-100 shadow-sm transition active:scale-95 hover:bg-neutral-800"
          @click="handleDigit(n)"
        >
          {{ n }}
        </button>

        <!-- Biometric or Clear button -->
        <button
          v-if="isBiometricSupported"
          type="button"
          class="flex size-18 items-center justify-center rounded-2xl bg-primary/10 text-primary transition active:scale-95 hover:bg-primary/20"
          title="Unlock with Face ID / Touch ID"
          @click="triggerBiometricUnlock"
        >
          <UIcon name="i-lucide-fingerprint" class="size-7" />
        </button>
        <button
          v-else
          type="button"
          class="flex size-18 items-center justify-center rounded-2xl text-xs font-medium text-neutral-400 transition active:scale-95 hover:text-white"
          @click="handleClear"
        >
          Clear
        </button>

        <!-- Zero -->
        <button
          type="button"
          class="flex size-18 items-center justify-center rounded-2xl bg-neutral-900/80 text-2xl font-semibold text-neutral-100 shadow-sm transition active:scale-95 hover:bg-neutral-800"
          @click="handleDigit('0')"
        >
          0
        </button>

        <!-- Backspace -->
        <button
          type="button"
          class="flex size-18 items-center justify-center rounded-2xl text-neutral-400 transition active:scale-95 hover:text-white"
          title="Backspace"
          @click="handleBackspace"
        >
          <UIcon name="i-lucide-delete" class="size-6" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
