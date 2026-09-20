import { useStorage } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useSupabase, useSupabaseAuth } from '~/composables/useSupabase'
import { showSuccessToast, showErrorToast } from '~/composables/useStoreSync'

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray as BufferSource
}

export function useNotifications() {
  const config = useRuntimeConfig()
  const supabase = useSupabase()
  const { uid } = useSupabaseAuth()

  const isSupported = ref(false)
  const permission = ref<NotificationPermission>('default')
  const isSubscribed = ref(false)
  const isLoading = ref(false)

  // Local preferences backed by useStorage
  const dailyReminderEnabled = useStorage<boolean>('elitemoney.notif.dailyReminder', true)
  const dailyReminderTime = useStorage<string>('elitemoney.notif.dailyTime', '21:00')
  const lendingAlertsEnabled = useStorage<boolean>('elitemoney.notif.lendingAlerts', true)
  const recurringAlertsEnabled = useStorage<boolean>('elitemoney.notif.recurringAlerts', true)

  function checkStatus() {
    if (!import.meta.client) return

    isSupported.value = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    if ('Notification' in window) {
      permission.value = Notification.permission
    }

    if (isSupported.value && permission.value === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          isSubscribed.value = !!sub
        })
      }).catch(() => {
        isSubscribed.value = false
      })
    }
  }

  onMounted(() => {
    checkStatus()
  })

  async function requestPermissionAndSubscribe(): Promise<boolean> {
    if (!isSupported.value) {
      showErrorToast('notifications.notSupported')
      return false
    }

    isLoading.value = true
    try {
      const perm = await Notification.requestPermission()
      permission.value = perm

      if (perm !== 'granted') {
        isLoading.value = false
        return false
      }

      const reg = await navigator.serviceWorker.ready
      const vapidKey = (config.public.vapidPublicKey as string) || 'BKpPNYWS-P4xd9rbR9k2tOfowDaBWRlmcm011Bd0_TJw1X4AOgtMsgM4yzgapn5owQsUb358_RM9-QjywofUOJU'

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
          userVisibleOnly: true,
        })
      }

      isSubscribed.value = true
      await syncSubscriptionToSupabase(sub)
      showSuccessToast('alerts.saved')
      return true
    }
    catch (err: unknown) {
      console.error('[WebPush] Error subscribing:', err)
      showErrorToast('base.error')
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  async function syncSubscriptionToSupabase(sub: PushSubscription) {
    if (!uid.value) return

    const subJson = sub.toJSON()
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    try {
      await supabase.from('push_subscriptions').upsert({
        user_id: uid.value,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        daily_reminder_enabled: dailyReminderEnabled.value,
        daily_reminder_time: dailyReminderTime.value,
        lending_reminder_enabled: lendingAlertsEnabled.value,
        recurring_reminder_enabled: recurringAlertsEnabled.value,
        timezone: userTimezone,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint',
      })
    }
    catch (e) {
      console.warn('[WebPush] Cloud sync skipped (offline or table not ready):', e)
    }
  }

  async function unsubscribe() {
    isLoading.value = true
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        if (uid.value) {
          await supabase.from('push_subscriptions')
            .delete()
            .match({ endpoint: sub.endpoint, user_id: uid.value })
        }
      }
      isSubscribed.value = false
      showSuccessToast('alerts.saved')
    }
    catch (err) {
      console.error('[WebPush] Error unsubscribing:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  async function savePreferences() {
    if (isSubscribed.value) {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await syncSubscriptionToSupabase(sub)
      }
    }
    showSuccessToast('alerts.saved')
  }

  async function sendTestNotification() {
    if (permission.value !== 'granted') {
      const granted = await requestPermissionAndSubscribe()
      if (!granted) return
    }

    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification('EliteMoney 🔔', {
        badge: '/favicon.svg',
        body: 'Notifications are active and configured perfectly on this device!',
        data: { url: '/dashboard' },
        icon: '/pwa-192x192.png',
      } as NotificationOptions)
      showSuccessToast('notifications.testSent')
    }
    catch (err) {
      console.error('[WebPush] Error showing test notification:', err)
      new Notification('EliteMoney 🔔', {
        body: 'Notifications are active and configured perfectly on this device!',
        icon: '/pwa-192x192.png',
      })
      showSuccessToast('notifications.testSent')
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    dailyReminderEnabled,
    dailyReminderTime,
    lendingAlertsEnabled,
    recurringAlertsEnabled,
    requestPermissionAndSubscribe,
    unsubscribe,
    savePreferences,
    sendTestNotification,
  }
}
