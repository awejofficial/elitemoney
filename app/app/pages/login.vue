<script setup lang="ts">
import { useDemo } from '~/components/demo/useDemo'
import { showErrorToast } from '~/composables/useStoreSync'
import { useSupabaseAuth } from '~/composables/useSupabase'

const { session, signInWithGoogle, signInWithPassword, signUpWithPassword } = useSupabaseAuth()
const logger = createLogger('login')

definePageMeta({
  layout: 'empty',
})

const { locale, t } = useI18n()

useSeoMeta({
  ogTitle: t('login.title'),
  title: t('login.title'),
})

const { generateDemoData, isDemo } = useDemo()
const route = useRoute()
const router = useRouter()

const isLoading = ref(false)

// Email/Password state
const authMode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isEmailSubmitting = ref(false)
const emailAuthError = ref<string | null>(null)
const emailAuthSuccess = ref<string | null>(null)

async function onEmailAuth() {
  if (!email.value.trim() || !password.value)
    return

  emailAuthError.value = null
  emailAuthSuccess.value = null
  isEmailSubmitting.value = true
  isDemo.value = null

  try {
    if (authMode.value === 'signin') {
      const { data, error } = await signInWithPassword(email.value.trim(), password.value)
      if (error)
        throw error
      if (data?.session) {
        router.replace(getSafeRedirectPath(route.query.redirect))
      }
    }
    else {
      const { data, error } = await signUpWithPassword(email.value.trim(), password.value)
      if (error)
        throw error
      if (data?.session) {
        router.replace(getSafeRedirectPath(route.query.redirect))
      }
      else {
        emailAuthSuccess.value = t('login.signUpSuccess')
      }
    }
  }
  catch (e: any) {
    logger.error('email auth error:', e)
    emailAuthError.value = e?.message || t('login.error')
  }
  finally {
    isEmailSubmitting.value = false
  }
}

// Set right before redirecting to Google, read on return: marks this load as the OAuth callback.
const OAUTH_PENDING_KEY = 'finapp.oauthPending'
const isOauthReturn = ref(false)

async function onGoogle() {
  isDemo.value = null
  isLoading.value = true

  try {
    const redirect = getSafeRedirectPath(route.query.redirect)
    const base = `${window.location.origin}/login`
    const redirectTo
      = redirect === '/dashboard'
        ? base
        : `${base}?redirect=${encodeURIComponent(redirect)}`

    // Survives the full-page redirect to Google and back (detectSessionInUrl can strip ?code= before we read it).
    sessionStorage.setItem(OAUTH_PENDING_KEY, '1')

    const { error } = await signInWithGoogle(redirectTo)
    if (error)
      throw error
  }
  catch (e: unknown) {
    sessionStorage.removeItem(OAUTH_PENDING_KEY)
    logger.error('google auth error:', e)
    showErrorToast('login.error')
    isLoading.value = false
  }
}

async function openDemo() {
  isDemo.value = 'true'
  await generateDemoData(locale.value)
  router.push(getSafeRedirectPath(route.query.redirect))
}

// If the session never lands (user aborted the Google flow, hit back, or the provider
// errored silently), give up on the spinner instead of hanging forever.
const OAUTH_RETURN_TIMEOUT_MS = 10_000
let oauthTimeout: ReturnType<typeof setTimeout> | undefined

function clearOauthReturn() {
  if (oauthTimeout) {
    clearTimeout(oauthTimeout)
    oauthTimeout = undefined
  }
  sessionStorage.removeItem(OAUTH_PENDING_KEY)
  isOauthReturn.value = false
  isLoading.value = false
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const pending = sessionStorage.getItem(OAUTH_PENDING_KEY) === '1'

  if (params.has('error')) {
    sessionStorage.removeItem(OAUTH_PENDING_KEY)
    logger.error(
      'google auth error:',
      params.get('error_description') ?? params.get('error'),
    )
    showErrorToast('login.error')
    return
  }

  if (pending || params.has('code')) {
    isOauthReturn.value = true
    isLoading.value = true
    oauthTimeout = setTimeout(() => {
      logger.error('google auth timed out: no session after OAuth return')
      clearOauthReturn()
    }, OAUTH_RETURN_TIMEOUT_MS)
  }
})

onUnmounted(() => {
  if (oauthTimeout)
    clearTimeout(oauthTimeout)
})

watch(
  session,
  (next) => {
    if (next && isOauthReturn.value) {
      if (oauthTimeout)
        clearTimeout(oauthTimeout)
      sessionStorage.removeItem(OAUTH_PENDING_KEY)
      router.replace(getSafeRedirectPath(route.query.redirect))
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="mx-auto grid size-full min-h-dvh max-w-xl grid-rows-[auto_1fr_auto] px-2 py-3"
  >
    <div class="flex items-center justify-end">
      <div class="w-fit max-md:fixed max-md:top-5 max-md:right-5 max-md:z-30">
        <LayoutHeaderMenu />
      </div>
    </div>

    <div
      class="grid h-full overflow-hidden overflow-y-auto px-3 py-4"
    >
      <div class="flex flex-col items-center justify-center">
        <UiLogo size="lg" />
        <div class="text-muted pt-1 text-sm text-center">
          {{ t("login.description") }}
        </div>

        <div class="grid w-full max-w-sm items-center gap-3 pt-8 pb-4">
          <!-- Google Auth Button -->
          <button
            class="shiny-pro"
            :disabled="isLoading || isEmailSubmitting"
            type="button"
            @click="onGoogle"
          >
            <span>
              <UIcon
                :name="isLoading ? 'i-lucide-loader-circle' : 'mdi:google'"
                class="size-5 shrink-0"
                :class="{ 'animate-spin': isLoading }"
              />
              {{ t("login.signInWithGoogle") }}
            </span>
          </button>

          <USeparator
            :label="t('login.orEmail')"
            :ui="{ label: 'text-muted text-xs' }"
            class="py-1"
          />

          <!-- Email / Password Card Form -->
          <div class="rounded-2xl border border-default bg-elevated/40 p-4 backdrop-blur shadow-sm">
            <!-- Tabs: Sign In / Register -->
            <div class="grid grid-cols-2 gap-1 rounded-xl bg-elevated/60 p-1 mb-3">
              <button
                type="button"
                class="rounded-lg py-1.5 text-xs font-medium transition-all"
                :class="authMode === 'signin' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-muted hover:text-highlighted'"
                @click="authMode = 'signin'; emailAuthError = null; emailAuthSuccess = null"
              >
                {{ t('login.authTabSignIn') }}
              </button>
              <button
                type="button"
                class="rounded-lg py-1.5 text-xs font-medium transition-all"
                :class="authMode === 'signup' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-muted hover:text-highlighted'"
                @click="authMode = 'signup'; emailAuthError = null; emailAuthSuccess = null"
              >
                {{ t('login.authTabSignUp') }}
              </button>
            </div>

            <!-- Error Banner -->
            <div
              v-if="emailAuthError"
              class="mb-3 rounded-lg border border-error/30 bg-error/10 p-2.5 text-xs text-error flex items-start gap-2"
            >
              <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0 mt-0.5" />
              <span class="break-words">{{ emailAuthError }}</span>
            </div>

            <!-- Success Banner -->
            <div
              v-if="emailAuthSuccess"
              class="mb-3 rounded-lg border border-success/30 bg-success/10 p-2.5 text-xs text-success flex items-start gap-2"
            >
              <UIcon name="i-lucide-check-circle-2" class="size-4 shrink-0 mt-0.5" />
              <span>{{ emailAuthSuccess }}</span>
            </div>

            <form class="grid gap-3" @submit.prevent="onEmailAuth">
              <div>
                <label class="block text-2xs font-medium text-muted pb-1">
                  {{ t('login.email') }}
                </label>
                <UInput
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  icon="i-lucide-mail"
                  placeholder="name@example.com"
                  size="md"
                  required
                />
              </div>

              <div>
                <label class="block text-2xs font-medium text-muted pb-1">
                  {{ t('login.password') }}
                </label>
                <div class="relative">
                  <UInput
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    icon="i-lucide-lock"
                    placeholder="••••••••"
                    size="md"
                    minlength="6"
                    required
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-highlighted"
                    @click="showPassword = !showPassword"
                  >
                    <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="size-4" />
                  </button>
                </div>
              </div>

              <UButton
                type="submit"
                color="primary"
                size="md"
                class="justify-center mt-1 font-medium rounded-xl"
                :loading="isEmailSubmitting"
                :disabled="isLoading || !email.trim() || !password"
              >
                {{ authMode === 'signin' ? t('login.signInWithEmail') : t('login.signUpWithEmail') }}
              </UButton>
            </form>
          </div>

          <USeparator
            :label="t('login.orDemo')"
            :ui="{ label: 'text-muted text-xs' }"
            class="py-1"
          />

          <UiButtonAccent
            rounded
            size="lg"
            type="button"
            variant="ghost"
            class="justify-center"
            @click="openDemo"
          >
            {{ t("login.openDemo") }}
          </UiButtonAccent>
        </div>
      </div>
    </div>

    <div class="flex-co flex-center pl-2">
      <AppCopyright />
    </div>
  </div>
</template>

<style>
@property --sp-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@property --sp-angle-offset {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@property --sp-percent {
  syntax: '<percentage>';
  initial-value: 5%;
  inherits: false;
}
@property --sp-shine {
  syntax: '<color>';
  initial-value: white;
  inherits: false;
}

.shiny-pro {
  --accent: var(--ui-primary, #146ef5);
  --bg: #0a0a0a;
  --animation: shiny-angle linear infinite;
  --duration: 9s;
  --shadow-size: 2px;
  --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  cursor: pointer;
  padding: 1.05rem 2.5rem;
  outline-offset: 4px;
  border: 1px solid transparent;
  border-radius: 9999px;
  color: #fff;
  font-family: inherit;
  font-size: 1.0625rem;
  font-weight: 500;
  line-height: 1.2;
  background:
    linear-gradient(var(--bg), var(--bg)) padding-box,
    conic-gradient(
        from calc(var(--sp-angle) - var(--sp-angle-offset)),
        transparent,
        var(--accent) var(--sp-percent),
        var(--sp-shine) calc(var(--sp-percent) * 2),
        var(--accent) calc(var(--sp-percent) * 3),
        transparent calc(var(--sp-percent) * 4)
      )
      border-box;
  box-shadow: inset 0 0 0 1px #1a1818;
  transition: var(--transition);
  transition-property: --sp-angle-offset, --sp-percent, --sp-shine;
}

.shiny-pro span {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
}

.shiny-pro::before,
.shiny-pro::after {
  content: '';
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  z-index: -1;
  translate: -50% -50%;
  pointer-events: none;
}

.shiny-pro:active {
  translate: 0 1px;
}

/* dotted halo */
.shiny-pro::before {
  --size: calc(100% - var(--shadow-size) * 3);
  --position: 2px;
  --space: calc(var(--position) * 2);
  width: var(--size);
  height: var(--size);
  background: radial-gradient(circle at var(--position) var(--position), white calc(var(--position) / 4), transparent 0)
    padding-box;
  background-size: var(--space) var(--space);
  background-repeat: space;
  mask-image: conic-gradient(from calc(var(--sp-angle) + 45deg), black, transparent 10% 90%, black);
  border-radius: inherit;
  opacity: 0.4;
}

/* inner shimmer */
.shiny-pro::after {
  --animation: shiny-shimmer linear infinite;
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(-50deg, transparent, var(--accent), transparent);
  mask-image: radial-gradient(circle at bottom, transparent 40%, black);
  opacity: 0.6;
}

.shiny-pro,
.shiny-pro::before,
.shiny-pro::after {
  animation:
    var(--animation) var(--duration),
    var(--animation) calc(var(--duration) / 0.4) reverse paused;
  animation-composition: add;
}

.shiny-pro:is(:hover, :focus-visible) {
  --sp-percent: 20%;
  --sp-angle-offset: 95deg;
  --sp-shine: color-mix(in srgb, var(--accent) 55%, white);
}

.shiny-pro:is(:hover, :focus-visible)::before {
  --position: 0;
}

@keyframes shiny-angle {
  to {
    --sp-angle: 360deg;
  }
}
@keyframes shiny-shimmer {
  to {
    rotate: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shiny-pro,
  .shiny-pro::before,
  .shiny-pro::after {
    animation: none;
  }
}
</style>
