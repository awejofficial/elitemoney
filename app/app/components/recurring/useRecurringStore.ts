import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useTrnsStore } from '~/components/trns/useTrnsStore'
import { TrnType } from '~/components/trns/types'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurringRule {
  id: string
  name: string
  type: TrnType.Expense | TrnType.Income
  amount: number
  currency: string
  walletId: string
  categoryId: string
  frequency: RecurrenceFrequency
  dayOfMonth?: number
  nextRunDate: number
  active: boolean
  note?: string
}

export const useRecurringStore = defineStore('recurring', () => {
  const rules = useStorage<Record<string, RecurringRule>>('elitemoney.recurringRules', {})

  const rulesList = computed<RecurringRule[]>(() =>
    Object.values(rules.value).sort((a, b) => {
      if (a.active !== b.active)
        return a.active ? -1 : 1
      return a.nextRunDate - b.nextRunDate
    }),
  )

  const activeRules = computed(() => rulesList.value.filter(r => r.active))

  const monthlyExpenseEstimate = computed(() => {
    return activeRules.value
      .filter(r => r.type === TrnType.Expense)
      .reduce((acc, r) => {
        let factor = 1
        if (r.frequency === 'daily')
          factor = 30
        else if (r.frequency === 'weekly')
          factor = 4.33
        else if (r.frequency === 'yearly')
          factor = 1 / 12
        return acc + r.amount * factor
      }, 0)
  })

  function calculateNextDate(currentDate: number, frequency: RecurrenceFrequency, dayOfMonth?: number): number {
    const d = new Date(currentDate)
    if (frequency === 'daily') {
      d.setDate(d.getDate() + 1)
    }
    else if (frequency === 'weekly') {
      d.setDate(d.getDate() + 7)
    }
    else if (frequency === 'monthly') {
      d.setMonth(d.getMonth() + 1)
      if (dayOfMonth) {
        d.setDate(Math.min(dayOfMonth, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
      }
    }
    else if (frequency === 'yearly') {
      d.setFullYear(d.getFullYear() + 1)
    }
    return d.getTime()
  }

  function addRule(data: Omit<RecurringRule, 'id' | 'active'> & { active?: boolean }): string {
    const id = `rr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    rules.value[id] = {
      id,
      ...data,
      active: data.active ?? true,
    }
    return id
  }

  function updateRule(id: string, data: Partial<Omit<RecurringRule, 'id'>>) {
    if (!rules.value[id])
      return
    rules.value[id] = { ...rules.value[id], ...data }
  }

  function deleteRule(id: string) {
    delete rules.value[id]
  }

  function toggleActive(id: string) {
    if (!rules.value[id])
      return
    rules.value[id].active = !rules.value[id].active
  }

  async function executeRule(id: string) {
    const rule = rules.value[id]
    if (!rule)
      return

    const trnsStore = useTrnsStore()
    const trnId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    trnsStore.saveTrn({
      id: trnId,
      values: {
        amount: rule.amount,
        categoryId: rule.categoryId,
        date: Date.now(),
        desc: rule.note ? `[Recurring] ${rule.name}: ${rule.note}` : `[Recurring] ${rule.name}`,
        type: rule.type,
        updatedAt: Date.now(),
        walletId: rule.walletId,
      },
    })

    rule.nextRunDate = calculateNextDate(rule.nextRunDate, rule.frequency, rule.dayOfMonth)
  }

  function seedSampleRules(walletId?: string, categoryId?: string, currency: string = 'USD') {
    if (Object.keys(rules.value).length > 0)
      return

    const defaultWalletId = walletId || 'wallet-1'
    const defaultCategoryId = categoryId || 'category-1'
    const now = Date.now()
    const dayMs = 86400000

    addRule({
      name: 'Netflix Premium',
      type: TrnType.Expense,
      amount: 19.99,
      currency,
      walletId: defaultWalletId,
      categoryId: defaultCategoryId,
      frequency: 'monthly',
      dayOfMonth: 1,
      nextRunDate: now + dayMs * 4,
      note: 'Family 4K plan',
    })

    addRule({
      name: 'Gym Membership',
      type: TrnType.Expense,
      amount: 45,
      currency,
      walletId: defaultWalletId,
      categoryId: defaultCategoryId,
      frequency: 'monthly',
      dayOfMonth: 15,
      nextRunDate: now + dayMs * 12,
      note: 'Fitness club',
    })

    addRule({
      name: 'Monthly Salary',
      type: TrnType.Income,
      amount: 3500,
      currency,
      walletId: defaultWalletId,
      categoryId: defaultCategoryId,
      frequency: 'monthly',
      dayOfMonth: 28,
      nextRunDate: now + dayMs * 18,
      note: 'Direct deposit',
    })
  }

  return {
    rules,
    rulesList,
    activeRules,
    monthlyExpenseEstimate,
    addRule,
    updateRule,
    deleteRule,
    toggleActive,
    executeRule,
    calculateNextDate,
    seedSampleRules,
  }
})
