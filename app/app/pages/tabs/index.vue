<script setup lang="ts">
import { useTabsStore, type DailyTabItem } from '~/components/tabs/useTabsStore'
import { useCurrenciesStore } from '~/components/currencies/useCurrenciesStore'
import { useWalletsStore } from '~/components/wallets/useWalletsStore'
import { useCategoriesStore } from '~/components/categories/useCategoriesStore'

defineOptions({ name: 'TabsPage' })

const { t } = useI18n()
const tabsStore = useTabsStore()
const currenciesStore = useCurrenciesStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()

useSeoMeta({
  title: computed(() => `${t('tabs.title')} — EliteMoney`),
  ogTitle: computed(() => `${t('tabs.title')} — EliteMoney`),
})

// Auto-seed sample Mess tab if the store is empty
onMounted(() => {
  const firstWallet = Object.keys(walletsStore.items ?? {})[0]
  const firstCat = Object.keys(categoriesStore.items ?? {})[0]
  tabsStore.seedSampleTab(firstWallet, firstCat, currenciesStore.base || 'INR')
})

const todayKey = computed(() => tabsStore.getTodayKey())
const currentYearMonth = computed(() => todayKey.value.slice(0, 7))

const totalActiveMonthDues = computed(() => {
  return tabsStore.tabsList.reduce((acc, tab) => {
    const summary = tabsStore.calculateMonthSummary(tab.id, currentYearMonth.value)
    return acc + (summary.isSettled ? 0 : summary.totalAmount)
  }, 0)
})

// Modal states
const isModalOpen = ref(false)
const editingTabId = ref<string | null>(null)
const presetChoice = ref<'mess' | 'milk' | 'water' | 'custom'>('mess')
const tabName = ref('')
const tabUnitPrice = ref<number | undefined>(70)
const tabUnitLabel = ref('tiffin')
const tabCurrency = ref(currenciesStore.base || 'INR')
const tabDefaultUnits = ref(2)
const isHasSlots = ref(true)

function applyPreset(type: 'mess' | 'milk' | 'water' | 'custom') {
  presetChoice.value = type
  if (type === 'mess') {
    tabName.value = 'College Mess (Tiffin)'
    tabUnitPrice.value = 70
    tabUnitLabel.value = 'tiffin'
    tabDefaultUnits.value = 2
    isHasSlots.value = true
  }
  else if (type === 'milk') {
    tabName.value = 'Daily Milk Delivery'
    tabUnitPrice.value = 65
    tabUnitLabel.value = 'liter'
    tabDefaultUnits.value = 1
    isHasSlots.value = false
  }
  else if (type === 'water') {
    tabName.value = 'Drinking Water Cans'
    tabUnitPrice.value = 30
    tabUnitLabel.value = 'can'
    tabDefaultUnits.value = 1
    isHasSlots.value = false
  }
  else {
    tabName.value = ''
    tabUnitPrice.value = 50
    tabUnitLabel.value = 'unit'
    tabDefaultUnits.value = 1
    isHasSlots.value = false
  }
}

function openAddModal() {
  editingTabId.value = null
  applyPreset('mess')
  isModalOpen.value = true
}

function openEditModal(tab: DailyTabItem, e?: Event) {
  e?.stopPropagation()
  e?.preventDefault()
  editingTabId.value = tab.id
  presetChoice.value = tab.categoryType as any
  tabName.value = tab.name
  tabUnitPrice.value = tab.unitPrice
  tabUnitLabel.value = tab.unitLabel
  tabCurrency.value = tab.currency
  tabDefaultUnits.value = tab.defaultUnitsPerDay
  isHasSlots.value = (tab.slots && tab.slots.length > 0)
  isModalOpen.value = true
}

function handleSaveTab() {
  if (!tabName.value.trim() || !tabUnitPrice.value || tabUnitPrice.value <= 0)
    return

  const slots = isHasSlots.value
    ? [
        { id: 'lunch', label: 'Lunch', defaultCount: 1 },
        { id: 'dinner', label: 'Dinner', defaultCount: 1 },
      ]
    : []

  const firstWallet = Object.keys(walletsStore.items ?? {})[0]
  const firstCat = Object.keys(categoriesStore.items ?? {})[0]

  if (editingTabId.value) {
    tabsStore.updateTab(editingTabId.value, {
      name: tabName.value.trim(),
      categoryType: presetChoice.value,
      unitPrice: Number(tabUnitPrice.value),
      unitLabel: tabUnitLabel.value.trim() || 'unit',
      currency: tabCurrency.value,
      defaultUnitsPerDay: Number(tabDefaultUnits.value) || 1,
      slots,
    })
    isModalOpen.value = false
  }
  else {
    const id = tabsStore.addTab({
      name: tabName.value.trim(),
      categoryType: presetChoice.value,
      unitPrice: Number(tabUnitPrice.value),
      unitLabel: tabUnitLabel.value.trim() || 'unit',
      currency: tabCurrency.value,
      defaultUnitsPerDay: Number(tabDefaultUnits.value) || 1,
      slots,
      defaultWalletId: firstWallet,
      defaultCategoryId: firstCat,
      icon: presetChoice.value === 'milk' ? 'lucide:milk' : presetChoice.value === 'water' ? 'lucide:droplets' : 'lucide:utensils',
      color: presetChoice.value === 'milk' ? '#38bdf8' : presetChoice.value === 'water' ? '#06b6d4' : '#f97316',
    })
    isModalOpen.value = false
    navigateTo(`/tabs/${id}`)
  }
}
</script>

<template>
  <UiPage>
    <UiHeader>
      <UiHeaderTitle>
        {{ t('tabs.title') }}
      </UiHeaderTitle>
      <template #actions>
        <UiActionButton
          :ariaLabel="t('tabs.new')"
          @click="openAddModal"
        >
          <Icon name="lucide:plus" size="24" />
        </UiActionButton>
      </template>
    </UiHeader>

    <div class="pageWrapper mb-4 rounded-xl pt-1 pb-24 lg:pb-8">
      <div class="grid gap-3.5 px-2 pt-1 @3xl/main:max-w-2xl">
        <!-- Monthly Running Total Hero Card -->
        <div class="rounded-xl border border-default bg-elevated/40 p-3.5 sm:p-4 backdrop-blur flex items-center justify-between">
          <div>
            <div class="text-2xs sm:text-xs font-medium text-muted">
              {{ t('tabs.monthlyEstimate') }}
            </div>
            <div class="pt-1 flex items-baseline gap-1.5 overflow-hidden">
              <Amount
                :amount="totalActiveMonthDues"
                :currencyCode="currenciesStore.base"
                variant="xl"
                class="text-base sm:text-xl"
              />
              <span class="text-2xs text-muted font-normal">/ this month</span>
            </div>
            <div class="text-3xs text-dimmed pt-0.5">
              {{ tabsStore.tabsList.length }} active daily subscriptions
            </div>
          </div>

          <div class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon name="hugeicons:invoice-03" size="24" />
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="tabsStore.tabsList.length === 0"
          class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-default p-8 text-center"
        >
          <div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="lucide:utensils" size="28" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-highlighted">
              {{ t('tabs.emptyTitle') }}
            </h3>
            <p class="text-xs text-muted pt-1 max-w-xs">
              {{ t('tabs.emptyDesc') }}
            </p>
          </div>
          <UButton
            icon="lucide:plus"
            size="md"
            color="primary"
            class="mt-2"
            @click="openAddModal"
          >
            {{ t('tabs.new') }}
          </UButton>
        </div>

        <!-- Tabs Cards List -->
        <div v-else class="grid gap-3">
          <div
            v-for="tab in tabsStore.tabsList"
            :key="tab.id"
            class="rounded-xl border border-default bg-elevated/40 p-3.5 backdrop-blur flex flex-col gap-3 transition-colors hover:border-primary/40 cursor-pointer"
            @click="navigateTo(`/tabs/${tab.id}`)"
          >
            <!-- Top Row: Icon, Title, Rate, and Edit/Chevron -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                  :style="{ backgroundColor: tab.color }"
                >
                  <Icon :name="tab.icon" size="18" />
                </div>
                <div class="min-w-0 truncate">
                  <div class="font-semibold text-highlighted text-sm leading-tight truncate">
                    {{ tab.name }}
                  </div>
                  <div class="text-3xs text-muted pt-0.5">
                    {{ tab.currency }} {{ tab.unitPrice }} / {{ tab.unitLabel }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  :title="t('tabs.edit')"
                  class="interactive flex size-7 items-center justify-center rounded-md text-muted hover:text-highlighted hover:bg-elevated"
                  @click="openEditModal(tab, $event)"
                >
                  <Icon name="lucide:pencil" size="14" />
                </button>
                <Icon name="lucide:chevron-right" size="16" class="text-dimmed" />
              </div>
            </div>

            <!-- Middle Row: Current Month Total & Days stats -->
            <div class="flex items-baseline justify-between pt-1 border-t border-default/40">
              <div>
                <span class="text-3xs font-medium text-muted uppercase tracking-wider block">
                  {{ t('tabs.monthDues') }}
                </span>
                <Amount
                  :amount="tabsStore.calculateMonthSummary(tab.id, currentYearMonth).totalAmount"
                  :currencyCode="tab.currency"
                  variant="sm"
                  class="font-semibold text-highlighted text-base pt-0.5"
                />
              </div>

              <div class="text-right">
                <div class="text-xs font-medium text-highlighted">
                  {{ tabsStore.calculateMonthSummary(tab.id, currentYearMonth).totalUnits }} {{ tab.unitLabel }}s
                </div>
                <div class="text-3xs text-muted">
                  {{ tabsStore.calculateMonthSummary(tab.id, currentYearMonth).attendedDays }} days logged
                </div>
              </div>
            </div>

            <!-- Bottom Row: 1-Tap Fast Logger for Today -->
            <div class="pt-2 border-t border-default/40 flex flex-wrap items-center justify-between gap-2" @click.stop>
              <div class="flex items-center gap-1.5 text-2xs text-muted font-medium">
                <Icon name="lucide:calendar-check-2" size="14" class="text-primary" />
                <span>{{ t('tabs.todayTally') }}:</span>
              </div>

              <!-- If Slots exist (Lunch / Dinner) -->
              <div v-if="tab.slots && tab.slots.length > 0" class="flex items-center gap-1.5">
                <button
                  v-for="slot in tab.slots"
                  :key="slot.id"
                  type="button"
                  class="interactive px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-all"
                  :class="[
                    (tabsStore.getDayLog(tab.id, todayKey).slots?.[slot.id] ?? slot.defaultCount) > 0
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-elevated/40 border-default text-muted opacity-60'
                  ]"
                  @click="tabsStore.quickToggleSlot(tab.id, todayKey, slot.id)"
                >
                  <span>{{ slot.label === 'Lunch' ? '☀️ Lunch' : slot.label === 'Dinner' ? '🌙 Dinner' : slot.label }}</span>
                  <span class="font-bold">
                    {{ (tabsStore.getDayLog(tab.id, todayKey).slots?.[slot.id] ?? slot.defaultCount) }}
                  </span>
                </button>
              </div>

              <!-- Simple Number Counter -->
              <div v-else class="flex items-center gap-1">
                <button
                  type="button"
                  class="interactive size-6 rounded bg-elevated border border-default flex items-center justify-center text-xs text-muted hover:text-highlighted"
                  @click="tabsStore.adjustTotalUnits(tab.id, todayKey, -1)"
                >
                  -
                </button>
                <span class="font-bold text-xs px-1 text-highlighted">
                  {{ tabsStore.getDayLog(tab.id, todayKey).totalUnits }} {{ tab.unitLabel }}s
                </span>
                <button
                  type="button"
                  class="interactive size-6 rounded bg-elevated border border-default flex items-center justify-center text-xs text-muted hover:text-highlighted"
                  @click="tabsStore.adjustTotalUnits(tab.id, todayKey, 1)"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Tab Modal -->
    <UModal v-model:open="isModalOpen" :title="editingTabId ? t('tabs.edit') : t('tabs.new')">
      <template #body>
        <form class="grid gap-3.5 p-4" @submit.prevent="handleSaveTab">
          <!-- Preset Selector -->
          <div v-if="!editingTabId">
            <label class="block text-xs font-medium text-muted pb-1.5">
              Choose Preset
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 text-xs"
                :class="presetChoice === 'mess' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-default bg-elevated/40 text-muted'"
                @click="applyPreset('mess')"
              >
                <Icon name="lucide:utensils" size="16" />
                <span>Mess / Tiffin</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 text-xs"
                :class="presetChoice === 'milk' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-default bg-elevated/40 text-muted'"
                @click="applyPreset('milk')"
              >
                <Icon name="lucide:milk" size="16" />
                <span>Daily Milk</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 text-xs"
                :class="presetChoice === 'water' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-default bg-elevated/40 text-muted'"
                @click="applyPreset('water')"
              >
                <Icon name="lucide:droplets" size="16" />
                <span>Water Cans</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 text-xs"
                :class="presetChoice === 'custom' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-default bg-elevated/40 text-muted'"
                @click="applyPreset('custom')"
              >
                <Icon name="lucide:plus" size="16" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              Tab Name *
            </label>
            <UInput
              v-model="tabName"
              placeholder="e.g. College Mess, Royal Tiffin"
              size="md"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted pb-1.5">
                {{ t('tabs.unitPrice') }} ({{ tabCurrency }}) *
              </label>
              <UInput
                v-model="tabUnitPrice"
                type="number"
                step="any"
                placeholder="70"
                size="md"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-muted pb-1.5">
                Unit Label
              </label>
              <UInput
                v-model="tabUnitLabel"
                placeholder="e.g. tiffin, meal, liter"
                size="md"
              />
            </div>
          </div>

          <!-- Slots Toggle (Lunch / Dinner) -->
          <div class="flex items-center justify-between p-2.5 rounded-lg border border-default bg-elevated/30">
            <div>
              <div class="text-xs font-medium text-highlighted">
                Separate Lunch & Dinner Slots
              </div>
              <div class="text-3xs text-muted">
                Provides individual 1-tap toggles for Lunch and Dinner
              </div>
            </div>
            <USwitch v-model="isHasSlots" size="sm" />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-default/60">
            <UButton variant="ghost" color="neutral" size="sm" @click="isModalOpen = false">
              {{ t('base.cancel') }}
            </UButton>
            <UButton type="submit" color="primary" size="sm" :disabled="!tabName.trim() || !tabUnitPrice || tabUnitPrice <= 0">
              {{ t('base.save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </UiPage>
</template>
