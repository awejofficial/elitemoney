<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import pkg from '~~/package.json'

import type { LocaleSlug } from '~/components/locale/types'

import { useCurrenciesStore } from '~/components/currencies/useCurrenciesStore'
import { useDemo } from '~/components/demo/useDemo'
import { useUserStore } from '~/components/user/useUserStore'
import { showSuccessToast } from '~/composables/useStoreSync'

import { clearPin, hasPin, setPin, verifyPin } from '~/components/security/pin'
import { clearBiometricCredential, hasBiometricCredential, isBiometricAvailable, registerBiometric } from '~/components/security/biometric'

const { locale, t } = useI18n()
const userStore = useUserStore()
const currenciesStore = useCurrenciesStore()
const { generateDemoData } = useDemo()
const { isDemo } = useDemo()
const isShowBaseCurrencyModal = ref(false)
const isShowMenuLabels = useStorage('finapp.isShowMenuLabels', true)
const isShowCurrencies = useStorage('finapp.isShowCurrencies', false)

const isPinActive = ref(false)
const isBiometricActive = ref(false)
const isBiometricSupported = ref(false)

const isPinModalOpen = ref(false)
const pinStep = ref<'create' | 'confirm' | 'remove'>('create')
const enteredPin = ref('')
const confirmPin = ref('')
const pinError = ref('')

function refreshSecurityStatus() {
  if (import.meta.client) {
    isPinActive.value = hasPin()
    isBiometricActive.value = hasBiometricCredential()
    isBiometricAvailable().then(avail => isBiometricSupported.value = avail)
  }
}

onMounted(() => {
  refreshSecurityStatus()
})

function openSetPinModal() {
  pinStep.value = 'create'
  enteredPin.value = ''
  confirmPin.value = ''
  pinError.value = ''
  isPinModalOpen.value = true
}

function openRemovePinModal() {
  pinStep.value = 'remove'
  enteredPin.value = ''
  pinError.value = ''
  isPinModalOpen.value = true
}

async function handlePinSubmit() {
  pinError.value = ''
  if (pinStep.value === 'create') {
    if (enteredPin.value.length < 4 || enteredPin.value.length > 6) {
      pinError.value = 'PIN must be 4 to 6 digits'
      return
    }
    pinStep.value = 'confirm'
    return
  }

  if (pinStep.value === 'confirm') {
    if (confirmPin.value !== enteredPin.value) {
      pinError.value = 'PINs do not match'
      confirmPin.value = ''
      return
    }
    await setPin(confirmPin.value)
    isPinModalOpen.value = false
    refreshSecurityStatus()
    showSuccessToast('alerts.saved')
    return
  }

  if (pinStep.value === 'remove') {
    const ok = await verifyPin(enteredPin.value)
    if (!ok) {
      pinError.value = 'Incorrect PIN'
      return
    }
    clearPin()
    clearBiometricCredential()
    isPinModalOpen.value = false
    refreshSecurityStatus()
    showSuccessToast('alerts.saved')
  }
}

async function toggleBiometric() {
  if (isBiometricActive.value) {
    clearBiometricCredential()
    refreshSecurityStatus()
  }
  else {
    try {
      await registerBiometric()
      refreshSecurityStatus()
      showSuccessToast('alerts.saved')
    }
    catch {
      // biometric registration cancelled
    }
  }
}

useSeoMeta({
  ogTitle: t('settings.title'),
  title: t('settings.title'),
})

const confirmRemoveUserData = ref(false)
const router = useRouter()

function removeAllUserData() {
  confirmRemoveUserData.value = false
  userStore.removeAllUserData()
  showSuccessToast('alerts.removedUserData')
  router.replace('/dashboard')
}

function onGenerateDemoData() {
  generateDemoData(locale.value)
  showSuccessToast('demo.updated')
}
</script>

<template>
  <UiPage>
    <UiHeader>
      <UiHeaderTitle>{{ t('settings.title') }}</UiHeaderTitle>
    </UiHeader>

    <div class="pageWrapper">
      <div class="grid gap-4 px-2 pt-2 pb-12 @3xl/main:max-w-lg">
        <!-- Theme -->
        <ThemePicker inline />

        <!-- Language -->
        <UiSettingsCard :title="t('locale.title')">
          <FormSelect
            :options="[
              { label: t('locale.ru'), value: 'ru' },
              { label: t('locale.en'), value: 'en' },
            ]"
            :value="locale"
            @change="(loc: string) => userStore.saveUserLocale(loc as LocaleSlug)"
          />
        </UiSettingsCard>

        <!-- Menu labels -->
        <UiSettingsCard :title="t('settings.mobileMenu')" class="md:hidden">
          <UiSwitchItem
            :checkboxValue="isShowMenuLabels"
            :title="t('settings.menuLabels')"
            @click="isShowMenuLabels = !isShowMenuLabels"
          />
        </UiSettingsCard>

        <!-- Currency -->
        <UiSettingsCard :title="t('currencies.page.title', 'Currencies')">
          <UiSwitchItem
            :checkboxValue="isShowCurrencies"
            :title="t('settings.enableCurrencies', 'Enable Currencies')"
            @click="isShowCurrencies = !isShowCurrencies"
          />

          <div v-if="isShowCurrencies" class="mt-4 pt-4 border-t border-default/10 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">{{ t('currencies.base') }}</p>
                <p class="text-xs text-muted">{{ t('currencies.baseDescription', 'Main currency used for totals and conversions') }}</p>
              </div>
              <button
                class="text-highlighted bg-elevated/30 ring-accented hover:!bg-elevated/50 focus-visible:ring-primary group relative inline-flex min-h-[38px] min-w-[130px] items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm ring transition-colors ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                @click="isShowBaseCurrencyModal = true"
              >
                <span class="truncate font-semibold">{{ currenciesStore.base }}</span>
                <UIcon name="i-lucide-chevrons-up-down" class="text-dimmed size-4 shrink-0" />
              </button>
            </div>

            <div class="flex items-center justify-between pt-1">
              <div>
                <p class="text-sm font-medium">{{ t('currencies.page.title') }}</p>
                <p class="text-xs text-muted">{{ t('currencies.manageRates', 'View exchange rates table') }}</p>
              </div>
              <UButton
                to="/currencies"
                variant="soft"
                color="neutral"
                size="sm"
                icon="hugeicons:money-exchange-01"
              >
                {{ t('base.open') }}
              </UButton>
            </div>
          </div>
        </UiSettingsCard>

        <!-- Security & App Lock -->
        <UiSettingsCard :title="t('security.title', 'Security & App Lock')">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">{{ t('security.pinLock', 'PIN Protection') }}</p>
                <p class="text-xs text-muted">{{ isPinActive ? t('security.pinEnabled', 'PIN is active. App locks when idle.') : t('security.pinDisabled', 'Protect access with a 4-6 digit code.') }}</p>
              </div>
              <UButton
                :variant="isPinActive ? 'soft' : 'solid'"
                :color="isPinActive ? 'error' : 'primary'"
                size="sm"
                @click="isPinActive ? openRemovePinModal() : openSetPinModal()"
              >
                {{ isPinActive ? t('security.removePin', 'Remove PIN') : t('security.setPin', 'Set PIN') }}
              </UButton>
            </div>

            <div v-if="isBiometricSupported" class="flex items-center justify-between pt-2 border-t border-default/10">
              <div>
                <p class="text-sm font-medium">{{ t('security.biometric', 'Biometric Unlock') }}</p>
                <p class="text-xs text-muted">{{ isBiometricActive ? t('security.biometricEnabled', 'Fingerprint / Face ID enabled') : t('security.biometricDisabled', 'Use device biometrics to unlock quickly') }}</p>
              </div>
              <UButton
                :disabled="!isPinActive"
                :variant="isBiometricActive ? 'soft' : 'outline'"
                :color="isBiometricActive ? 'primary' : 'neutral'"
                size="sm"
                @click="toggleBiometric"
              >
                {{ isBiometricActive ? t('security.disable', 'Disable') : t('security.enable', 'Enable') }}
              </UButton>
            </div>
          </div>
        </UiSettingsCard>

        <!-- Notifications & Reminders -->
        <SettingsNotificationsCard />

        <!-- Extension point for layers (e.g. premium Telegram card) -->
        <ExtensionSlot name="settings" />

        <!-- Demo -->
        <UiSettingsCard
          v-if="isDemo"
          :title="t('demo.update')"
        >
          <UButton
            variant="outline"
            color="secondary"
            size="md"
            @click="onGenerateDemoData"
          >
            {{ t('demo.update') }}
          </UButton>
        </UiSettingsCard>

        <!-- Delete -->
        <UiSettingsCard
          danger
          :title="t('settings.deleteButton')"
          :description="t('alerts.willDeleteEverything')"
        >
          <template #footer>
            <UButton
              variant="soft"
              color="error"
              size="md"
              @click="confirmRemoveUserData = true"
            >
              {{ t('settings.deleteButton') }}
            </UButton>
          </template>
        </UiSettingsCard>

        <!-- User -->
        <UiSettingsCard
          danger
          :title="t('user.title')"
        >
          <UserViewLogout isShowSignOut />
        </UiSettingsCard>

        <!-- About -->
        <div class="text-muted pt-4 text-xs">
          {{ t('app.version') }} {{ pkg.version }}
        </div>
      </div>
    </div>

    <LayoutConfirmModal
      v-if="confirmRemoveUserData"
      :title="t('settings.deleteButton')"
      :description="t('alerts.willDeleteEverything')"
      @closed="confirmRemoveUserData = false"
      @confirm="removeAllUserData"
    />

    <CurrenciesModal
      v-if="isShowBaseCurrencyModal"
      :activeCode="currenciesStore.base"
      @select="userStore.saveUserBaseCurrency"
      @close="isShowBaseCurrencyModal = false"
    />

    <UModal v-model:open="isPinModalOpen" :title="pinStep === 'remove' ? t('security.removePin', 'Remove PIN') : (pinStep === 'create' ? t('security.setPin', 'Set PIN') : t('security.confirmPin', 'Confirm PIN'))">
      <template #body>
        <div class="space-y-4 p-4">
          <p class="text-sm text-muted">
            {{ pinStep === 'remove' ? t('security.enterCurrentPin', 'Enter your current PIN to remove it:') : (pinStep === 'create' ? t('security.choosePin', 'Choose a 4-6 digit PIN:') : t('security.reenterPin', 'Re-enter your PIN to confirm:')) }}
          </p>
          <input
            v-if="pinStep === 'create'"
            v-model="enteredPin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            placeholder="••••"
            class="w-full text-center text-2xl tracking-widest py-2 rounded-md border border-default/20 bg-elevated/40 focus:outline-none focus:ring-2 focus:ring-primary"
            @keyup.enter="handlePinSubmit"
          />
          <input
            v-else-if="pinStep === 'confirm'"
            v-model="confirmPin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            placeholder="••••"
            class="w-full text-center text-2xl tracking-widest py-2 rounded-md border border-default/20 bg-elevated/40 focus:outline-none focus:ring-2 focus:ring-primary"
            @keyup.enter="handlePinSubmit"
          />
          <input
            v-else-if="pinStep === 'remove'"
            v-model="enteredPin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            placeholder="••••"
            class="w-full text-center text-2xl tracking-widest py-2 rounded-md border border-default/20 bg-elevated/40 focus:outline-none focus:ring-2 focus:ring-primary"
            @keyup.enter="handlePinSubmit"
          />
          <p v-if="pinError" class="text-xs text-red-500 font-medium text-center">
            {{ pinError }}
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" color="neutral" @click="isPinModalOpen = false">
              {{ t('base.cancel') }}
            </UButton>
            <UButton color="primary" @click="handlePinSubmit">
              {{ pinStep === 'create' ? t('base.next', 'Next') : (pinStep === 'confirm' ? t('base.save') : t('base.delete')) }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UiPage>
</template>
