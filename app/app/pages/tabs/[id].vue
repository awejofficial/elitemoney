<script setup lang="ts">
import { useTabsStore } from '~/components/tabs/useTabsStore'
import { useCurrenciesStore } from '~/components/currencies/useCurrenciesStore'
import { useWalletsStore } from '~/components/wallets/useWalletsStore'
import { useCategoriesStore } from '~/components/categories/useCategoriesStore'

defineOptions({ name: 'TabDetailPage' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const tabsStore = useTabsStore()
const currenciesStore = useCurrenciesStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()

const tabId = computed(() => route.params.id as string)
const tab = computed(() => tabsStore.tabs[tabId.value])

useSeoMeta({
  title: computed(() => `${tab.value?.name || 'Daily Tab'} — EliteMoney`),
  ogTitle: computed(() => `${tab.value?.name || 'Daily Tab'} — EliteMoney`),
})

// Current month navigator
const selectedYearMonth = ref(tabsStore.getTodayKey().slice(0, 7))

function parseYearMonth(ym: string) {
  const parts = ym.split('-')
  const year = Number(parts[0]) || new Date().getFullYear()
  const month = Number(parts[1]) || (new Date().getMonth() + 1)
  return { month, year }
}

const displayMonthName = computed(() => {
  const { month, year } = parseYearMonth(selectedYearMonth.value)
  return new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
})

function prevMonth() {
  const { month, year } = parseYearMonth(selectedYearMonth.value)
  const d = new Date(year, month - 2, 1)
  selectedYearMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth() {
  const { month, year } = parseYearMonth(selectedYearMonth.value)
  const d = new Date(year, month, 1)
  selectedYearMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthSummary = computed(() => {
  return tabsStore.calculateMonthSummary(tabId.value, selectedYearMonth.value)
})

// Generate list of days for the selected month
const daysInSelectedMonth = computed(() => {
  const { month, year } = parseYearMonth(selectedYearMonth.value)
  const daysCount = new Date(year, month, 0).getDate()
  const isCurrentMonth = tabsStore.getTodayKey().startsWith(selectedYearMonth.value)
  const currentDay = isCurrentMonth ? new Date().getDate() : daysCount

  const days: { dateKey: string; dayNum: number; dayName: string; isToday: boolean }[] = []
  for (let d = daysCount; d >= 1; d--) {
    const dateObj = new Date(year, month - 1, d)
    const dateKey = `${selectedYearMonth.value}-${String(d).padStart(2, '0')}`
    days.push({
      dateKey,
      dayNum: d,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: dateKey === tabsStore.getTodayKey(),
    })
  }
  return days
})

// Modals
const isOptionsOpen = ref(false)
const isSettleModalOpen = ref(false)
const isDeleteConfirmOpen = ref(false)
const isShareToastOpen = ref(false)
const isEditModalOpen = ref(false)

const popularCurrencies = computed(() => {
  const base = currenciesStore.base || 'INR'
  const list = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY', 'RUB']
  if (!list.includes(base))
    return [base, ...list]
  return [base, ...list.filter(c => c !== base)]
})

const editName = ref('')
const editUnitPrice = ref<number | undefined>(70)
const editUnitLabel = ref('tiffin')
const editCurrency = ref('INR')
const editHasSlots = ref(true)
const editSlotLabels = ref<{ id: string; label: string }[]>([])

function openEditModal() {
  if (!tab.value)
    return
  editName.value = tab.value.name
  editUnitPrice.value = tab.value.unitPrice
  editUnitLabel.value = tab.value.unitLabel
  editCurrency.value = tab.value.currency || currenciesStore.base || 'INR'
  editHasSlots.value = Boolean(tab.value.slots && tab.value.slots.length > 0)
  editSlotLabels.value = tab.value.slots?.length
    ? tab.value.slots.map(s => ({ id: s.id, label: s.label }))
    : []
  isEditModalOpen.value = true
}

function handleSaveEdit() {
  if (!editName.value.trim() || !editUnitPrice.value || editUnitPrice.value <= 0)
    return

  const slots = editHasSlots.value && editSlotLabels.value.length > 0
    ? editSlotLabels.value
        .filter(s => s.label.trim())
        .map(s => ({ id: s.id || `slot_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, label: s.label.trim(), defaultCount: 1 }))
    : []

  tabsStore.updateTab(tabId.value, {
    name: editName.value.trim(),
    unitPrice: Number(editUnitPrice.value),
    unitLabel: editUnitLabel.value.trim() || 'unit',
    currency: editCurrency.value,
    slots,
  })
  isEditModalOpen.value = false
}

const settleWalletId = ref('')
const settleCategoryId = ref('')

const walletOptions = computed(() => {
  return Object.entries(walletsStore.items ?? {}).map(([id, w]) => ({
    label: `${w.name} (${w.currency})`,
    value: id,
  }))
})

const categoryOptions = computed(() => {
  return Object.entries(categoriesStore.items ?? {}).map(([id, c]) => ({
    label: c.name,
    value: id,
  }))
})

function openSettleModal() {
  settleWalletId.value = tab.value?.defaultWalletId || walletOptions.value[0]?.value || ''
  settleCategoryId.value = tab.value?.defaultCategoryId || categoryOptions.value[0]?.value || ''
  isSettleModalOpen.value = true
}

function handleConfirmSettle() {
  if (!settleWalletId.value)
    return
  tabsStore.settleMonth(tabId.value, selectedYearMonth.value, settleWalletId.value, settleCategoryId.value)
  isSettleModalOpen.value = false
}

async function handleShareSlip() {
  const slipText = tabsStore.generateShareSlip(tabId.value, selectedYearMonth.value)
  if (!slipText)
    return

  try {
    if (navigator.share) {
      await navigator.share({
        title: `${tab.value?.name} — ${displayMonthName.value}`,
        text: slipText,
      })
    }
    else {
      await navigator.clipboard.writeText(slipText)
      isShareToastOpen.value = true
      setTimeout(() => {
        isShareToastOpen.value = false
      }, 3000)
    }
  }
  catch {
    await navigator.clipboard.writeText(slipText)
    isShareToastOpen.value = true
    setTimeout(() => {
      isShareToastOpen.value = false
    }, 3000)
  }
}

function handleDeleteConfirm() {
  tabsStore.deleteTab(tabId.value)
  isDeleteConfirmOpen.value = false
  router.replace('/tabs')
}
</script>

<template>
  <UiPage v-if="tab">
    <UiHeader backTo="/tabs">
      <UiHeaderTitle>
        {{ tab.name }}
      </UiHeaderTitle>

      <template #actions>
        <BottomSheetOrDropdown
          :isOpen="isOptionsOpen"
          isShowCloseBtn
          @closeModal="isOptionsOpen = false"
          @openModal="isOptionsOpen = true"
        >
          <template #trigger>
            <UiActionButton :ariaLabel="$t('base.moreOptions')">
              <Icon name="lucide:ellipsis-vertical" size="20" />
            </UiActionButton>
          </template>

          <template #content>
            <div class="p-1 pt-3 pb-2 min-w-[200px]">
              <UiHeaderLink
                icon="lucide:pencil"
                @click="isOptionsOpen = false; openEditModal()"
              >
                {{ t('tabs.edit') }}
              </UiHeaderLink>

              <UiHeaderLink
                icon="lucide:share-2"
                @click="isOptionsOpen = false; handleShareSlip()"
              >
                {{ t('tabs.shareSlip') }}
              </UiHeaderLink>

              <UiHeaderLink
                v-if="!monthSummary.isSettled && monthSummary.totalAmount > 0"
                icon="lucide:check-check"
                @click="isOptionsOpen = false; openSettleModal()"
              >
                {{ t('tabs.settleMonth') }}
              </UiHeaderLink>

              <UiHeaderLink
                icon="lucide:trash-2"
                class="text-error"
                @click="isOptionsOpen = false; isDeleteConfirmOpen = true"
              >
                {{ t('base.delete') }}
              </UiHeaderLink>
            </div>
          </template>
        </BottomSheetOrDropdown>
      </template>
    </UiHeader>

    <div class="pageWrapper mb-4 rounded-xl pt-1 pb-24 lg:pb-8">
      <div class="grid gap-3.5 px-2 pt-1 @3xl/main:max-w-2xl">
        <!-- Month Selector Navigator -->
        <div class="flex items-center justify-between px-1">
          <button
            type="button"
            class="interactive size-8 rounded-lg border border-default bg-elevated/40 flex items-center justify-center text-muted hover:text-highlighted"
            @click="prevMonth"
          >
            <Icon name="lucide:chevron-left" size="18" />
          </button>

          <span class="font-semibold text-sm text-highlighted">
            {{ displayMonthName }}
          </span>

          <button
            type="button"
            class="interactive size-8 rounded-lg border border-default bg-elevated/40 flex items-center justify-center text-muted hover:text-highlighted"
            @click="nextMonth"
          >
            <Icon name="lucide:chevron-right" size="18" />
          </button>
        </div>

        <!-- Month Hero Card -->
        <div class="rounded-2xl border border-default bg-elevated/40 p-4 sm:p-5 backdrop-blur flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xs font-medium text-muted uppercase tracking-wider">
                {{ monthSummary.isSettled ? t('tabs.settled') : t('tabs.monthDues') }}
              </div>
              <div class="pt-1 flex items-baseline gap-2">
                <Amount
                  :amount="monthSummary.totalAmount"
                  :currencyCode="tab.currency"
                  variant="xl"
                  class="font-bold text-2xl text-highlighted"
                />
                  <UBadge
                    v-if="monthSummary.isSettled"
                    color="success"
                    variant="subtle"
                    size="xs"
                  >
                    {{ t('tabs.paid') }}
                  </UBadge>
              </div>
            </div>

            <div class="text-right">
              <div class="text-xs font-semibold text-highlighted">
                {{ monthSummary.totalUnits }} {{ tab.unitLabel }}s
              </div>
              <div class="text-3xs text-muted pt-0.5">
                {{ tab.currency }} {{ tab.unitPrice }} / {{ tab.unitLabel }}
              </div>
            </div>
          </div>

          <!-- Quick Metrics Row -->
          <div class="grid grid-cols-3 gap-2 pt-2 border-t border-default/40 text-center">
            <div class="p-2 rounded-lg bg-elevated/30">
              <div class="text-3xs text-muted uppercase font-medium">{{ t('tabs.attended') }}</div>
              <div class="text-xs font-bold text-highlighted pt-0.5">
                {{ monthSummary.attendedDays }} {{ t('tabs.days') }}
              </div>
            </div>

            <div class="p-2 rounded-lg bg-elevated/30">
              <div class="text-3xs text-muted uppercase font-medium">{{ t('tabs.skipped') }}</div>
              <div class="text-xs font-bold text-amber-500 pt-0.5">
                {{ monthSummary.skippedUnits }} {{ tab.unitLabel }}s
              </div>
            </div>

            <div class="p-2 rounded-lg bg-elevated/30">
              <div class="text-3xs text-muted uppercase font-medium">{{ t('tabs.saved') }}</div>
              <div class="text-xs font-bold text-income pt-0.5">
                {{ tab.currency }} {{ monthSummary.savedAmount }}
              </div>
            </div>
          </div>

          <!-- Action Buttons (Settle & Share) -->
          <div class="grid grid-cols-2 gap-2 pt-2">
            <UButton
              v-if="!monthSummary.isSettled && monthSummary.totalAmount > 0"
              icon="lucide:check-check"
              size="sm"
              color="primary"
              variant="solid"
              class="justify-center rounded-xl font-medium"
              @click="openSettleModal"
            >
              {{ t('tabs.settleMonth') }}
            </UButton>
            <div v-else class="flex items-center justify-center text-xs text-income font-medium gap-1 bg-income/10 rounded-xl py-1.5 border border-income/20">
              <Icon name="lucide:check-circle-2" size="16" />
              <span>{{ t('tabs.monthSettled') }}</span>
            </div>

            <UButton
              icon="lucide:share-2"
              size="sm"
              color="neutral"
              variant="outline"
              class="justify-center rounded-xl"
              @click="handleShareSlip"
            >
              {{ t('tabs.shareSlip') }}
            </UButton>
          </div>
        </div>

        <!-- Copied Toast alert -->
        <div
          v-if="isShareToastOpen"
          class="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-primary flex items-center justify-between"
        >
          <span>{{ t('tabs.slipCopied') }}</span>
          <Icon name="lucide:check" size="16" />
        </div>

        <!-- Attendance Ledger Section -->
        <div>
          <div class="flex items-center justify-between pb-2 px-1">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ t('tabs.history') }}
            </h3>
            <span class="text-xs text-muted">
              {{ daysInSelectedMonth.length }} {{ t('tabs.days') }}
            </span>
          </div>

          <!-- Days List -->
          <div class="grid gap-0.5 rounded-xl border border-default/60 bg-elevated/20 overflow-hidden">
            <div
              v-for="day in daysInSelectedMonth"
              :key="day.dateKey"
              class="p-2.5 sm:px-3 flex items-center justify-between border-b border-default/40 last:border-b-0 hover:bg-elevated/30 transition-colors"
              :class="{ 'bg-primary/5': day.isToday }"
            >
              <!-- Left: Date & Day Name -->
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  class="flex flex-col items-center justify-center size-9 rounded-lg border text-center font-bold"
                  :class="[
                    day.isToday
                      ? 'border-primary bg-primary/15 text-primary'
                      : (tabsStore.getDayLog(tab.id, day.dateKey).totalUnits === 0)
                        ? 'border-default bg-elevated/40 text-dimmed'
                        : 'border-default/80 bg-elevated text-highlighted'
                  ]"
                >
                  <span class="text-3xs font-normal leading-none uppercase">{{ day.dayName }}</span>
                  <span class="text-xs leading-none pt-0.5">{{ day.dayNum }}</span>
                </div>

                <div class="min-w-0">
                  <div class="text-xs font-medium flex items-center gap-1.5">
                    <span :class="day.isToday ? 'text-primary font-bold' : 'text-highlighted'">
                      {{ day.isToday ? t('tabs.today') : `${displayMonthName.slice(0, 3)} ${day.dayNum}` }}
                    </span>
                    <span
                      v-if="tabsStore.getDayLog(tab.id, day.dateKey).totalUnits === 0"
                      class="text-3xs text-muted italic"
                    >
                      ({{ t('tabs.offSkipped') }})
                    </span>
                  </div>

                  <div v-if="tabsStore.getDayLog(tab.id, day.dateKey).note" class="text-3xs text-muted truncate">
                    {{ tabsStore.getDayLog(tab.id, day.dateKey).note }}
                  </div>
                </div>
              </div>

              <!-- Right: 1-Tap Toggle Controls & Subtotal -->
              <div class="flex items-center gap-2 shrink-0">
                <!-- If tab has slots (Lunch / Dinner) -->
                <div v-if="tab.slots && tab.slots.length > 0" class="flex items-center gap-1">
                  <button
                    v-for="slot in tab.slots"
                    :key="slot.id"
                    type="button"
                    class="interactive px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-all"
                    :class="[
                      (tabsStore.getDayLog(tab.id, day.dateKey).slots?.[slot.id] ?? slot.defaultCount) > 0
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-elevated/30 border-default text-muted opacity-40'
                    ]"
                    @click="tabsStore.quickToggleSlot(tab.id, day.dateKey, slot.id)"
                  >
                    <span>{{ slot.label === 'Lunch' ? '☀️' : slot.label === 'Dinner' ? '🌙' : slot.label }}</span>
                    <span class="font-bold text-3xs">
                      {{ (tabsStore.getDayLog(tab.id, day.dateKey).slots?.[slot.id] ?? slot.defaultCount) }}
                    </span>
                  </button>
                </div>

                <!-- If simple units counter -->
                <div v-else class="flex items-center gap-1">
                  <button
                    type="button"
                    class="interactive size-6 rounded bg-elevated border border-default flex items-center justify-center text-xs text-muted hover:text-highlighted"
                    @click="tabsStore.adjustTotalUnits(tab.id, day.dateKey, -1)"
                  >
                    -
                  </button>
                  <span class="font-bold text-xs px-1 text-highlighted">
                    {{ tabsStore.getDayLog(tab.id, day.dateKey).totalUnits }}
                  </span>
                  <button
                    type="button"
                    class="interactive size-6 rounded bg-elevated border border-default flex items-center justify-center text-xs text-muted hover:text-highlighted"
                    @click="tabsStore.adjustTotalUnits(tab.id, day.dateKey, 1)"
                  >
                    +
                  </button>
                </div>

                <!-- Daily Amount Subtotal -->
                <div class="text-right min-w-[50px]">
                  <Amount
                    :amount="tabsStore.getDayLog(tab.id, day.dateKey).totalUnits * tab.unitPrice"
                    :currencyCode="tab.currency"
                    variant="sm"
                    align="right"
                    :class="tabsStore.getDayLog(tab.id, day.dateKey).totalUnits === 0 ? 'text-dimmed opacity-40' : 'text-highlighted font-medium'"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settle Month Modal -->
    <UModal v-model:open="isSettleModalOpen" :title="`${t('tabs.settleMonth')} — ${displayMonthName}`">
      <template #body>
        <div class="grid gap-3.5 p-4">
          <div class="rounded-xl border border-default bg-elevated/40 p-3 flex items-center justify-between">
            <div>
              <div class="text-xs text-muted">{{ t('tabs.totalPayable') }}</div>
              <div class="text-lg font-bold text-highlighted pt-0.5">
                {{ tab.currency }} {{ monthSummary.totalAmount }}
              </div>
            </div>
            <div class="text-right text-xs text-muted">
              {{ monthSummary.totalUnits }} {{ tab.unitLabel }}s • {{ monthSummary.attendedDays }} days
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('tabs.payFromWallet') }} *
            </label>
            <select
              v-model="settleWalletId"
              class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option
                v-for="opt in walletOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('tabs.expenseCategory') }}
            </label>
            <select
              v-model="settleCategoryId"
              class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option
                v-for="opt in categoryOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-default/60">
            <UButton variant="ghost" color="neutral" size="sm" @click="isSettleModalOpen = false">
              {{ t('base.cancel') }}
            </UButton>
            <UButton color="primary" size="sm" :disabled="!settleWalletId" @click="handleConfirmSettle">
              {{ t('tabs.confirmSettle') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Confirm Delete Modal -->
    <LayoutConfirmModal
      v-if="isDeleteConfirmOpen"
      :title="t('tabs.deleteConfirm')"
      @closed="isDeleteConfirmOpen = false"
      @confirm="handleDeleteConfirm"
    />

    <!-- Edit Tab Modal -->
    <UModal v-model:open="isEditModalOpen" :title="t('tabs.edit')">
      <template #body>
        <form class="grid gap-3.5 p-4" @submit.prevent="handleSaveEdit">
          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('tabs.tabName') }} *
            </label>
            <UInput
              v-model="editName"
              :placeholder="t('tabs.tabNamePlaceholder')"
              size="md"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted pb-1.5">
                {{ t('tabs.unitPrice') }} *
              </label>
              <UInput
                v-model="editUnitPrice"
                type="number"
                step="any"
                placeholder="70"
                size="md"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-muted pb-1.5">
                {{ t('tabs.currency') }}
              </label>
              <select
                v-model="editCurrency"
                class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option v-for="c in popularCurrencies" :key="c" :value="c">
                  {{ c }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('tabs.unitLabel') }}
            </label>
            <UInput
              v-model="editUnitLabel"
              :placeholder="t('tabs.unitLabelPlaceholder')"
              size="md"
            />
          </div>

          <!-- Slots Toggle (Lunch / Dinner) -->
          <div class="flex items-center justify-between p-2.5 rounded-lg border border-default bg-elevated/30">
            <div>
              <div class="text-xs font-medium text-highlighted">
                {{ t('tabs.separateSlots') }}
              </div>
              <div class="text-3xs text-muted">
                {{ t('tabs.separateSlotsDesc') }}
              </div>
            </div>
            <USwitch v-model="editHasSlots" size="sm" />
          </div>

          <!-- Custom Slot Names -->
          <div v-if="editHasSlots" class="grid gap-2">
            <div v-for="(slot, idx) in editSlotLabels" :key="slot.id" class="flex items-center gap-2">
              <UInput
                v-model="slot.label"
                :placeholder="`${t('tabs.slotName')} ${idx + 1}`"
                size="sm"
                class="flex-1"
              />
              <button
                v-if="editSlotLabels.length > 1"
                type="button"
                class="interactive flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:text-error hover:bg-elevated"
                @click="editSlotLabels.splice(idx, 1)"
              >
                <Icon name="lucide:x" size="14" />
              </button>
            </div>
            <button
              type="button"
              class="interactive flex items-center gap-1 text-2xs text-primary hover:text-primary/80 pt-0.5"
              @click="editSlotLabels.push({ id: `slot_${Date.now()}`, label: '' })"
            >
              <Icon name="lucide:plus" size="12" />
              <span>{{ t('tabs.addSlot') }}</span>
            </button>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-default/60">
            <UButton variant="ghost" color="neutral" size="sm" @click="isEditModalOpen = false">
              {{ t('base.cancel') }}
            </UButton>
            <UButton type="submit" color="primary" size="sm" :disabled="!editName.trim() || !editUnitPrice || editUnitPrice <= 0">
              {{ t('base.save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </UiPage>
</template>
