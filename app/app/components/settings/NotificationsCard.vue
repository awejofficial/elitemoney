<script setup lang="ts">
import { useNotifications } from '~/composables/useNotifications'

const { t } = useI18n()
const {
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
} = useNotifications()

function toggleDaily() {
  dailyReminderEnabled.value = !dailyReminderEnabled.value
  savePreferences()
}

function toggleLending() {
  lendingAlertsEnabled.value = !lendingAlertsEnabled.value
  savePreferences()
}

function toggleRecurring() {
  recurringAlertsEnabled.value = !recurringAlertsEnabled.value
  savePreferences()
}
</script>

<template>
  <UiSettingsCard :title="t('notifications.title')">
    <div class="space-y-4">
      <!-- Unsupported Browser Notice -->
      <div v-if="!isSupported" class="text-xs text-muted">
        {{ t('notifications.notSupported') }}
      </div>

      <!-- Blocked in browser settings -->
      <div v-else-if="permission === 'denied'" class="rounded-lg border border-error/20 bg-error/10 p-3 text-xs text-error flex items-center gap-2">
        <Icon name="lucide:bell-off" size="16" class="shrink-0" />
        <span>{{ t('notifications.blocked') }}</span>
      </div>

      <!-- Permission not yet granted: Prompt button -->
      <div v-else-if="permission !== 'granted' || !isSubscribed" class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium">{{ t('notifications.title') }}</p>
          <p class="text-xs text-muted">{{ t('notifications.desc') }}</p>
        </div>

        <UButton
          color="primary"
          size="sm"
          variant="solid"
          :loading="isLoading"
          @click="() => { requestPermissionAndSubscribe() }"
        >
          {{ t('notifications.enable') }}
        </UButton>
      </div>

      <!-- Permission Active & Configured -->
      <div v-else class="space-y-3.5">
        <!-- Status & Test Bar -->
        <div class="flex items-center justify-between pb-2 border-b border-default/20">
          <div class="flex items-center gap-1.5 text-xs text-income font-medium">
            <span class="size-2 rounded-full bg-income animate-pulse" />
            <span>{{ t('notifications.enabled') }}</span>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              size="xs"
              variant="subtle"
              color="neutral"
              icon="lucide:send"
              @click="sendTestNotification"
            >
              {{ t('notifications.testNotification') }}
            </UButton>

            <button
              type="button"
              :title="$t('base.delete')"
              class="interactive text-muted hover:text-error text-2xs p-1 rounded hover:bg-elevated"
              @click="unsubscribe"
            >
              <Icon name="lucide:bell-off" size="14" />
            </button>
          </div>
        </div>

        <!-- Daily Reminder Toggle -->
        <div class="space-y-2">
          <UiSwitchItem
            :checkboxValue="dailyReminderEnabled"
            :title="t('notifications.dailyReminder')"
            @click="toggleDaily"
          />

          <div
            v-if="dailyReminderEnabled"
            class="flex items-center justify-between pl-4 pr-1 py-1 rounded-md bg-elevated/20 border border-default/15"
          >
            <span class="text-xs text-muted font-medium">{{ t('notifications.time') }}</span>
            <input
              v-model="dailyReminderTime"
              type="time"
              class="rounded-md border border-default bg-elevated px-2.5 py-1 text-xs text-highlighted focus:outline-none focus:ring-1 focus:ring-primary"
              @change="savePreferences"
            />
          </div>
        </div>

        <!-- Lending Alerts Toggle -->
        <UiSwitchItem
          :checkboxValue="lendingAlertsEnabled"
          :title="t('notifications.lendingAlerts')"
          @click="toggleLending"
        />

        <!-- Recurring Bills Alerts Toggle -->
        <UiSwitchItem
          :checkboxValue="recurringAlertsEnabled"
          :title="t('notifications.recurringAlerts')"
          @click="toggleRecurring"
        />
      </div>
    </div>
  </UiSettingsCard>
</template>
