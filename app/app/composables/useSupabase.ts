import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@supabase/supabase-js'

import { AUTH_STORAGE_KEY } from '~/composables/useAuthSession'

// Singleton Supabase client. Sessions persist in localStorage and auto-refresh.
// `detectSessionInUrl` is on so the PKCE `?code=` from the Google OAuth redirect is
// exchanged for a session on return; it's a no-op on normal loads (no code param).
let _client: SupabaseClient | null = null

export function useSupabase(): SupabaseClient {
  if (_client)
    return _client

  const config = useRuntimeConfig()
  const url = (config.public.supabaseUrl as string) || 'https://demo.supabase.co'
  const anonKey = (config.public.supabaseAnonKey as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.demo'

  _client = createClient(
    url,
    anonKey,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        // Fixed key the synchronous route gate (useAuthSession) reads directly.
        storageKey: AUTH_STORAGE_KEY,
      },
    },
  )
  return _client
}

// Reactive auth state, backed by a module-level ref kept in sync via
// onAuthStateChange. Initialized once on the client.
const session = shallowRef<Session | null>(null)
const isAuthReady = ref(false)
let _authInitialized = false

export function useSupabaseAuth() {
  const client = useSupabase()

  if (!_authInitialized && import.meta.client) {
    _authInitialized = true
    client.auth.getSession().then(({ data }) => {
      session.value = data.session
      isAuthReady.value = true
    })
    client.auth.onAuthStateChange((_event: AuthChangeEvent, next: Session | null) => {
      session.value = next
      isAuthReady.value = true
    })
  }

  return {
    isAuthReady,
    session,
    // OAuth redirect flow: supabase-js stores a PKCE verifier and navigates to Google.
    // On return, `detectSessionInUrl` exchanges the code (see login.vue). `redirectTo` must
    // be allow-listed in Supabase auth config (config.toml additional_redirect_urls / dashboard).
    signInWithGoogle: (redirectTo: string) =>
      client.auth.signInWithOAuth({ options: { redirectTo }, provider: 'google' }),
    signInWithPassword: (email: string, password: string) =>
      client.auth.signInWithPassword({ email, password }),
    signUpWithPassword: (email: string, password: string) =>
      client.auth.signUp({ email, password }),
    signOut: () => client.auth.signOut(),
    uid: computed<string | null>(() => session.value?.user?.id ?? null),
    user: computed(() => session.value?.user ?? null),
  }
}
