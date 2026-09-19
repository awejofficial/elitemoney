<script setup lang="ts">
import { useRecurringStore, type RecurrenceFrequency, type RecurringRule } from '~/components/recurring/useRecurringStore'
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
  title: computed(() => `${t('recurring.title')} — EliteMoney`),
  ogTitle: computed(() => `${t('recurring.title')} — EliteMoney`),
})

const isModalOpen = ref(false)
const editingRuleId = ref<string | null>(null)
const isExecuting = ref<string | null>(null)
const deleteRuleId = ref<string | null>(null)

const ruleName = ref('')
const ruleType = ref<TrnType.Expense | TrnType.Income>(TrnType.Expense)
const ruleAmount = ref<number | undefined>(undefined)
const ruleFrequency = ref<RecurrenceFrequency>('monthly')
const ruleDayOfMonth = ref<number>(1)
const ruleWalletId = ref('')
const ruleCategoryId = ref('')
const ruleNote = ref('')

const frequencyOptions = computed(() => [
  { label: t('recurring.daily'), value: 'daily' },
  { label: t('recurring.weekly'), value: 'weekly' },
  { label: t('recurring.monthly'), value: 'monthly' },
  { label: t('recurring.yearly'), value: 'yearly' },
])

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
  editingRuleId.value = null
  ruleName.value = ''
  ruleType.value = TrnType.Expense
  ruleAmount.value = undefined
  ruleFrequency.value = 'monthly'
  ruleDayOfMonth.value = new Date().getDate()
  ruleWalletId.value = walletOptions.value[0]?.value || ''
  ruleCategoryId.value = categoryOptions.value[0]?.value || ''
  ruleNote.value = ''
  isModalOpen.value = true
}

function openEditModal(rule: RecurringRule, e?: Event) {
  e?.stopPropagation()
  e?.preventDefault()
  editingRuleId.value = rule.id
  ruleName.value = rule.name
  ruleType.value = rule.type
  ruleAmount.value = rule.amount
  ruleFrequency.value = rule.frequency
  ruleDayOfMonth.value = rule.dayOfMonth || 1
  ruleWalletId.value = rule.walletId
  ruleCategoryId.value = rule.categoryId
  ruleNote.value = rule.note || ''
  isModalOpen.value = true
}

function handleSaveRule() {
  if (!ruleName.value.trim() || !ruleAmount.value || ruleAmount.value <= 0)
    return

  if (editingRuleId.value) {
    recurringStore.updateRule(editingRuleId.value, {
      name: ruleName.value.trim(),
      type: ruleType.value,
      amount: Number(ruleAmount.value),
      walletId: ruleWalletId.value,
      categoryId: ruleCategoryId.value,
      frequency: ruleFrequency.value,
      dayOfMonth: ruleDayOfMonth.value,
      note: ruleNote.value.trim() || undefined,
    })
    isModalOpen.value = false
  }
  else {
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
    isModalOpen.value = false
  }
}

async function handleExecute(ruleId: string, e?: Event) {
  e?.stopPropagation()
  isExecuting.value = ruleId
  try {
    await recurringStore.executeRule(ruleId)
  }
  finally {
    isExecuting.value = null
  }
}

function handleDeleteConfirm() {
  if (deleteRuleId.value) {
    recurringStore.deleteRule(deleteRuleId.value)
    deleteRuleId.value = null
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

function getCategoryIcon(id: string) {
  return categoriesStore.items?.[id]?.icon || 'hugeicons:folder-library'
}

function getCategoryColor(id: string) {
  return categoriesStore.items?.[id]?.color
}
</script>

<template>
  <UiPage>
    <UiHeader>
      <UiHeaderTitle>
        {{ t('recurring.title') }}
      </UiHeaderTitle>
      <template #actions>
        <UiActionButton
          :ariaLabel="t('recurring.new')"
          @click="openAddModal"
        >
          <Icon name="lucide:plus" size="24" />
        </UiActionButton>
      </template>
    </UiHeader>

    <div class="pageWrapper">
      <div class="grid gap-4 px-2 pt-2 pb-16 @3xl/main:max-w-2xl">
        <!-- Monthly Estimate Card -->
        <div class="rounded-xl border border-default bg-elevated/40 p-4 backdrop-blur flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-muted">
              {{ t('recurring.monthlyEstimate') }}
            </div>
            <div class="pt-1.5 flex items-baseline gap-1.5">
              <Amount
                :amount="Math.round(recurringStore.monthlyExpenseEstimate)"
                :currencyCode="currenciesStore.base"
                variant="xl"
              />
              <span class="text-xs text-muted font-normal">/ {{ t('recurring.monthly').toLowerCase() }}</span>
            </div>
          </div>
          <div class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon name="lucide:calendar-clock" size="22" />
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="recurringStore.rulesList.length === 0"
          class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-default p-8 text-center"
        >
          <div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="lucide:repeat" size="28" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-highlighted">
              {{ t('recurring.noRules') }}
            </h3>
            <p class="text-xs text-muted pt-1 max-w-xs">
              {{ t('recurring.desc') }}
            </p>
          </div>
          <UButton
            icon="lucide:plus"
            size="md"
            color="primary"
            class="mt-2"
            @click="openAddModal"
          >
            {{ t('recurring.new') }}
          </UButton>
        </div>

        <!-- Rules List -->
        <div v-else class="grid gap-1">
          <UiElement
            v-for="rule in recurringStore.rulesList"
            :key="rule.id"
            insideClasses="p-3 min-h-[56px] flex items-center justify-between"
            :class="{ 'opacity-50': !rule.active }"
            class="group cursor-pointer"
            @click="openEditModal(rule)"
          >
            <!-- Left side: Category Icon & Details -->
            <div class="flex items-center gap-3 min-w-0">
              <UiIconBase
                :name="getCategoryIcon(rule.categoryId)"
                :color="getCategoryColor(rule.categoryId)"
                invert
              />

              <div class="min-w-0 truncate">
                <div class="font-medium text-highlighted text-sm flex items-center gap-2 truncate">
                  <span class="truncate">{{ rule.name }}</span>
                  <UBadge size="xs" color="neutral" variant="subtle" class="capitalize text-3xs shrink-0">
                    {{ rule.frequency }}
                  </UBadge>
                </div>
                <div class="text-3xs text-dimmed flex items-center gap-1.5 pt-0.5 truncate">
                  <span>{{ getCategoryName(rule.categoryId) }}</span>
                  <span>•</span>
                  <span>{{ getWalletName(rule.walletId) }}</span>
                  <span>•</span>
                  <span class="text-amber-500 font-medium">
                    {{ t('recurring.nextRun') }}: {{ formatDate(rule.nextRunDate) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right side: Amount, Run, Switch, Edit, Delete -->
            <div class="flex items-center gap-2 shrink-0">
              <Amount
                :amount="rule.amount"
                :currencyCode="rule.currency"
                :colorize="rule.type === TrnType.Expense ? 'expense' : 'income'"
                :isShowMinus="rule.type === TrnType.Expense"
                :isShowPlus="rule.type === TrnType.Income"
                variant="sm"
                align="right"
              />

              <!-- Record Now / Play button -->
              <button
                type="button"
                :title="t('recurring.recordNow')"
                :disabled="isExecuting === rule.id"
                class="interactive flex size-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                @click="handleExecute(rule.id, $event)"
              >
                <Icon
                  :name="isExecuting === rule.id ? 'lucide:loader-circle' : 'lucide:play'"
                  :class="{ 'animate-spin': isExecuting === rule.id }"
                  size="15"
                />
              </button>

              <!-- Active Toggle Switch -->
              <USwitch
                :model-value="rule.active"
                size="xs"
                @click.stop
                @update:model-value="recurringStore.toggleActive(rule.id)"
              />

              <!-- Edit Button -->
              <button
                type="button"
                :title="t('recurring.edit')"
                class="interactive flex size-7 items-center justify-center rounded-md text-muted hover:text-highlighted hover:bg-elevated"
                @click="openEditModal(rule, $event)"
              >
                <Icon name="lucide:pencil" size="14" />
              </button>

              <!-- Delete Button -->
              <button
                type="button"
                :title="$t('base.delete')"
                class="interactive flex size-7 items-center justify-center rounded-md text-muted hover:text-error hover:bg-error/10"
                @click.stop="deleteRuleId = rule.id"
              >
                <Icon name="lucide:trash-2" size="14" />
              </button>
            </div>
          </UiElement>
        </div>
      </div>
    </div>

    <!-- Add / Edit Rule Modal -->
    <UModal v-model:open="isModalOpen" :title="editingRuleId ? t('recurring.edit') : t('recurring.new')">
      <template #body>
        <form class="grid gap-3.5 p-4" @submit.prevent="handleSaveRule">
          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('recurring.ruleName') }} *
            </label>
            <UInput
              v-model="ruleName"
              placeholder="e.g. Netflix Subscription, Apartment Rent"
              size="md"
              autofocus
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted pb-1.5">
                {{ t('base.type') }}
              </label>
              <select
                v-model="ruleType"
                class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option :value="TrnType.Expense">{{ t('money.expense') }}</option>
                <option :value="TrnType.Income">{{ t('money.income') }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-muted pb-1.5">
                {{ t('base.amount') }} ({{ currenciesStore.base }}) *
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

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted pb-1.5">
                {{ t('recurring.frequency') }}
              </label>
              <select
                v-model="ruleFrequency"
                class="w-full rounded-md border border-default bg-elevated px-3 py-2 text-sm text-highlighted focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option
                  v-for="opt in frequencyOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div v-if="ruleFrequency === 'monthly'">
              <label class="block text-xs font-medium text-muted pb-1.5">
                {{ t('recurring.dayOfMonth') }}
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

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted pb-1.5">
                {{ t('recurring.wallet') }}
              </label>
              <select
                v-model="ruleWalletId"
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
                {{ t('recurring.category') }}
              </label>
              <select
                v-model="ruleCategoryId"
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
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('base.description') }}
            </label>
            <UInput
              v-model="ruleNote"
              placeholder="e.g. Family 4K plan, Direct deposit"
              size="md"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" color="neutral" @click="isModalOpen = false">
              {{ t('base.cancel') }}
            </UButton>
            <UButton type="submit" color="primary" :disabled="!ruleName.trim() || !ruleAmount || ruleAmount <= 0">
              {{ t('base.save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- Confirm Delete Modal -->
    <LayoutConfirmModal
      v-if="deleteRuleId"
      :title="t('recurring.deleteConfirm')"
      @closed="deleteRuleId = null"
      @confirm="handleDeleteConfirm"
    />
  </UiPage>
</template>
