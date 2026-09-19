<script setup lang="ts">
import { useRecurringStore, type RecurrenceFrequency } from '~/components/recurring/useRecurringStore'
import { useWalletsStore } from '~/components/wallets/useWalletsStore'
import { useCategoriesStore } from '~/components/categories/useCategoriesStore'
import { useCurrenciesStore } from '~/components/currencies/useCurrenciesStore'
import { TrnType } from '~/components/trns/types'

defineOptions({ name: 'RecurringPage' })

const { t } = useI18n()
const recurringStore = useRecurringStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const currenciesStore = useCurrenciesStore()

useSeoMeta({
  title: 'Recurring Rules — EliteMoney',
  ogTitle: 'Recurring Rules — EliteMoney',
})

const isAddModalOpen = ref(false)
const isExecuting = ref<string | null>(null)

const ruleName = ref('')
const ruleType = ref<TrnType.Expense | TrnType.Income>(TrnType.Expense)
const ruleAmount = ref<number | undefined>(undefined)
const ruleFrequency = ref<RecurrenceFrequency>('monthly')
const ruleDayOfMonth = ref<number>(1)
const ruleWalletId = ref('')
const ruleCategoryId = ref('')
const ruleNote = ref('')

const frequencyOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const typeOptions = [
  { label: 'Expense', value: TrnType.Expense },
  { label: 'Income', value: TrnType.Income },
]

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

function openAddModal() {
  ruleName.value = ''
  ruleType.value = TrnType.Expense
  ruleAmount.value = undefined
  ruleFrequency.value = 'monthly'
  ruleDayOfMonth.value = new Date().getDate()
  ruleWalletId.value = walletOptions.value[0]?.value || ''
  ruleCategoryId.value = categoryOptions.value[0]?.value || ''
  ruleNote.value = ''
  isAddModalOpen.value = true
}

function handleAddRule() {
  if (!ruleName.value.trim() || !ruleAmount.value || ruleAmount.value <= 0)
    return

  const now = Date.now()
  const nextDate = recurringStore.calculateNextDate(now, ruleFrequency.value, ruleDayOfMonth.value)

  recurringStore.addRule({
    name: ruleName.value.trim(),
    type: ruleType.value,
    amount: Number(ruleAmount.value),
    currency: currenciesStore.base,
    walletId: ruleWalletId.value,
    categoryId: ruleCategoryId.value,
    frequency: ruleFrequency.value,
    dayOfMonth: ruleDayOfMonth.value,
    nextRunDate: nextDate,
    note: ruleNote.value.trim() || undefined,
  })

  isAddModalOpen.value = false
}

async function handleExecute(ruleId: string) {
  isExecuting.value = ruleId
  try {
    await recurringStore.executeRule(ruleId)
  }
  finally {
    isExecuting.value = null
  }
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getWalletName(id: string) {
  return walletsStore.items?.[id]?.name || 'Wallet'
}

function getCategoryName(id: string) {
  return categoriesStore.items?.[id]?.name || 'Category'
}
</script>

<template>
  <UiPage>
    <UiHeader>
      <UiHeaderTitle>
        {{ t('recurring.title', 'Recurring Rules') }}
      </UiHeaderTitle>
      <template #actions>
        <UButton
          icon="i-lucide-plus"
          size="sm"
          color="primary"
          variant="solid"
          @click="openAddModal"
        >
          {{ t('recurring.addRule', 'Add Rule') }}
        </UButton>
      </template>
    </UiHeader>

    <div class="pageWrapper">
      <div class="grid gap-4 px-2 pt-2 pb-16 @3xl/main:max-w-2xl">
        <!-- Monthly Estimate Card -->
        <div class="rounded-2xl border border-default bg-elevated/40 p-4 backdrop-blur">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-medium text-muted">
                {{ t('recurring.monthlyEstimate', 'Estimated Monthly Recurring Cost') }}
              </div>
              <div class="pt-1 text-2xl font-bold text-highlighted font-brand">
                ~{{ Math.round(recurringStore.monthlyExpenseEstimate) }} {{ currenciesStore.base }}
                <span class="text-xs text-muted font-normal">/ month</span>
              </div>
            </div>
            <div class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UIcon name="i-lucide-calendar-clock" class="size-5" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="recurringStore.rulesList.length === 0"
          class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-default p-8 text-center"
        >
          <div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UIcon name="i-lucide-repeat" class="size-7" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-highlighted">
              {{ t('recurring.noRulesYet', 'No recurring rules') }}
            </h3>
            <p class="text-xs text-muted pt-1 max-w-xs">
              {{ t('recurring.emptyDesc', 'Set up automatic reminders and recurring records for subscriptions, rent, SIPs, and salary.') }}
            </p>
          </div>
          <UButton
            icon="i-lucide-plus"
            size="md"
            color="primary"
            class="mt-2"
            @click="openAddModal"
          >
            {{ t('recurring.addFirstRule', 'Add first recurring rule') }}
          </UButton>
        </div>

        <!-- Rules List -->
        <div v-else class="flex flex-col divide-y divide-default overflow-hidden rounded-2xl border border-default bg-elevated/30">
          <div
            v-for="rule in recurringStore.rulesList"
            :key="rule.id"
            class="flex items-center justify-between p-3.5 transition-colors hover:bg-elevated/50"
            :class="{ 'opacity-50': !rule.active }"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex size-9 items-center justify-center rounded-xl text-sm"
                :class="rule.type === TrnType.Expense ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'"
              >
                <UIcon :name="rule.type === TrnType.Expense ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-left'" class="size-4" />
              </div>

              <div>
                <div class="font-medium text-highlighted text-sm flex items-center gap-2">
                  <span>{{ rule.name }}</span>
                  <UBadge size="xs" color="neutral" variant="subtle" class="capitalize text-2xs">
                    {{ rule.frequency }}
                  </UBadge>
                </div>
                <div class="text-3xs text-dimmed flex items-center gap-2 pt-0.5">
                  <span>{{ getCategoryName(rule.categoryId) }}</span>
                  <span>•</span>
                  <span>{{ getWalletName(rule.walletId) }}</span>
                  <span>•</span>
                  <span class="text-amber-500/90 font-medium">
                    Next: {{ formatDate(rule.nextRunDate) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Amount, Run button & Active toggle -->
            <div class="flex items-center gap-2.5">
              <div
                class="text-xs font-semibold text-right"
                :class="rule.type === TrnType.Expense ? 'text-rose-500' : 'text-emerald-500'"
              >
                {{ rule.type === TrnType.Expense ? '-' : '+' }}{{ rule.amount }} {{ rule.currency }}
              </div>

              <UButton
                icon="i-lucide-play"
                size="xs"
                color="primary"
                variant="subtle"
                title="Record transaction now"
                :loading="isExecuting === rule.id"
                @click="handleExecute(rule.id)"
              />

              <USwitch
                :model-value="rule.active"
                size="xs"
                @update:model-value="recurringStore.toggleActive(rule.id)"
              />

              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="recurringStore.deleteRule(rule.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Rule Modal -->
    <UModal v-model:open="isAddModalOpen" :title="t('recurring.addRule', 'Add Recurring Rule')">
      <template #body>
        <form class="grid gap-3 p-4" @submit.prevent="handleAddRule">
          <div>
            <label class="block text-xs font-medium text-muted pb-1">
              {{ t('recurring.ruleName', 'Rule Name') }} *
            </label>
            <UInput
              v-model="ruleName"
              placeholder="e.g. Netflix Subscription, Apartment Rent"
              size="md"
              autofocus
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-muted pb-1">
                {{ t('base.type', 'Type') }}
              </label>
              <select
                v-model="ruleType"
                class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted"
              >
                <option :value="TrnType.Expense">Expense</option>
                <option :value="TrnType.Income">Income</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-muted pb-1">
                {{ t('base.amount', 'Amount') }} *
              </label>
              <UInput
                v-model="ruleAmount"
                type="number"
                step="any"
                placeholder="0.00"
                size="md"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-muted pb-1">
                {{ t('recurring.frequency', 'Frequency') }}
              </label>
              <select
                v-model="ruleFrequency"
                class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted capitalize"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div v-if="ruleFrequency === 'monthly'">
              <label class="block text-xs font-medium text-muted pb-1">
                {{ t('recurring.dayOfMonth', 'Day of Month') }}
              </label>
              <UInput
                v-model="ruleDayOfMonth"
                type="number"
                min="1"
                max="31"
                size="md"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-muted pb-1">
                {{ t('wallets.name', 'Wallet') }}
              </label>
              <select
                v-model="ruleWalletId"
                class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted"
              >
                <option v-for="w in walletOptions" :key="w.value" :value="w.value">
                  {{ w.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-muted pb-1">
                {{ t('categories.name', 'Category') }}
              </label>
              <select
                v-model="ruleCategoryId"
                class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted"
              >
                <option v-for="c in categoryOptions" :key="c.value" :value="c.value">
                  {{ c.label }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1">
              {{ t('base.description', 'Note (optional)') }}
            </label>
            <UInput
              v-model="ruleNote"
              placeholder="e.g. Auto-debit on 5th"
              size="md"
            />
          </div>

          <div class="flex justify-end gap-2 pt-3">
            <UButton variant="ghost" color="neutral" @click="isAddModalOpen = false">
              {{ t('base.cancel', 'Cancel') }}
            </UButton>
            <UButton type="submit" color="primary" :disabled="!ruleName.trim() || !ruleAmount || ruleAmount <= 0">
              {{ t('base.save', 'Save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </UiPage>
</template>
