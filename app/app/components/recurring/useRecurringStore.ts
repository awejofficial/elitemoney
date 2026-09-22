import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSupabase, useSupabaseAuth } from '~/composables/useSupabase'
import { useTrnsStore } from '~/components/trns/useTrnsStore'
import { TrnType } from '~/components/trns/types'
import { createLogger } from '~/utils/logger'

const logger = createLogger('recurring-store')

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(str: string): boolean {
  return UUID_REGEX.test(str)
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function encodeRuleNote(rule: {
  name: string
  currency: string
  walletId: string
  note?: string
}): string {
  return JSON.stringify({
    currency: rule.currency || 'USD',
    name: rule.name || '',
    note: rule.note || '',
    walletId: rule.walletId || '',
  })
}

function decodeRuleNote(rawNote: string | null): {
  name?: string
  currency?: string
  walletId?: string
  note?: string
} {
  if (!rawNote)
    return {}
  try {
    const parsed = JSON.parse(rawNote)
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        currency: parsed.currency,
        name: parsed.name,
        note: parsed.note,
        walletId: parsed.walletId,
      }
    }
  }
  catch {
    return { note: rawNote }
  }
  return {}
}

function toIsoDate(timestamp: number): string {
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime()))
    return new Date().toISOString()
  return d.toISOString()
}

function fromIsoDate(dateStr: string | null | undefined): number {
  if (!dateStr)
    return Date.now()
  const parsed = new Date(dateStr).getTime()
  return Number.isNaN(parsed) ? Date.now() : parsed
}

export const useRecurringStore = defineStore('recurring', () => {
  const rules = useStorage<Record<string, RecurringRule>>('elitemoney.recurringRules', {})
  const legacyIdMap = ref<Record<string, string>>({})
  const isSyncing = ref(false)
  const isLoaded = ref(false)

  const supabase = useSupabase()
  const { uid } = useSupabaseAuth()

  let realtimeChannel: any = null

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

  async function migrateLocalRulesToSupabase(currentUid: string) {
    const localRules = { ...rules.value }
    let hasChanges = false

    for (const [id, r] of Object.entries(localRules)) {
      let activeId = id
      if (!isUuid(id)) {
        activeId = generateId()
        legacyIdMap.value[id] = activeId
        localRules[activeId] = { ...r, id: activeId }
        delete localRules[id]
        hasChanges = true
      }

      try {
        await supabase.from('recurring_rules').upsert({
          active: r.active,
          amount: r.amount,
          category_id: r.categoryId,
          created_at: new Date().toISOString(),
          day_of_month: r.dayOfMonth ?? null,
          frequency: r.frequency,
          id: activeId,
          next_run_date: toIsoDate(r.nextRunDate),
          note: encodeRuleNote(r),
          type: r.type,
          user_id: currentUid,
        })
      }
      catch (err) {
        logger.error('Failed to sync migrated recurring rule', r.name, err)
      }
    }

    if (hasChanges)
      rules.value = localRules
  }

  async function fetchFromSupabase() {
    const currentUid = uid.value
    if (!currentUid)
      return

    isSyncing.value = true
    try {
      const { data, error } = await supabase
        .from('recurring_rules')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        logger.error('Error fetching recurring rules from Supabase', error)
      }
      else if (data) {
        const nextRules: Record<string, RecurringRule> = {}
        for (const row of data) {
          const decoded = decodeRuleNote(row.note)
          nextRules[row.id] = {
            active: !!row.active,
            amount: Number(row.amount) || 0,
            categoryId: row.category_id || '',
            currency: decoded.currency || 'USD',
            dayOfMonth: row.day_of_month ? Number(row.day_of_month) : undefined,
            frequency: (row.frequency || 'monthly') as RecurrenceFrequency,
            id: row.id,
            name: decoded.name || 'Recurring Rule',
            nextRunDate: fromIsoDate(row.next_run_date),
            note: decoded.note,
            type: Number(row.type) === TrnType.Income ? TrnType.Income : TrnType.Expense,
            walletId: decoded.walletId || '',
          }
        }

        if (data.length === 0 && Object.keys(rules.value).length > 0) {
          await migrateLocalRulesToSupabase(currentUid)
        }
        else {
          rules.value = { ...rules.value, ...nextRules }
        }
      }

      isLoaded.value = true
    }
    catch (err) {
      logger.error('Unexpected error fetching recurring rules', err)
    }
    finally {
      isSyncing.value = false
    }
  }

  function setupRealtime() {
    if (realtimeChannel) {
      realtimeChannel.unsubscribe()
      realtimeChannel = null
    }

    const currentUid = uid.value
    if (!currentUid)
      return

    realtimeChannel = supabase
      .channel('realtime:recurring_rules')
      .on(
        'postgres_changes',
        { event: '*', filter: `user_id=eq.${currentUid}`, schema: 'public', table: 'recurring_rules' },
        (payload) => {
          logger.log('Realtime recurring_rules change received', payload.eventType)
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            delete rules.value[payload.old.id]
          }
          else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const row = payload.new
            const decoded = decodeRuleNote(row.note)
            rules.value[row.id] = {
              active: !!row.active,
              amount: Number(row.amount) || 0,
              categoryId: row.category_id || '',
              currency: decoded.currency || 'USD',
              dayOfMonth: row.day_of_month ? Number(row.day_of_month) : undefined,
              frequency: (row.frequency || 'monthly') as RecurrenceFrequency,
              id: row.id,
              name: decoded.name || 'Recurring Rule',
              nextRunDate: fromIsoDate(row.next_run_date),
              note: decoded.note,
              type: Number(row.type) === TrnType.Income ? TrnType.Income : TrnType.Expense,
              walletId: decoded.walletId || '',
            }
          }
        },
      )
      .subscribe()
  }

  function init() {
    if (import.meta.client) {
      fetchFromSupabase()
      setupRealtime()
    }
  }

  if (import.meta.client) {
    watch(uid, (newUid) => {
      if (newUid) {
        init()
      }
      else if (realtimeChannel) {
        realtimeChannel.unsubscribe()
        realtimeChannel = null
      }
    }, { immediate: true })

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && uid.value) {
        fetchFromSupabase()
      }
    })
  }

  function addRule(data: Omit<RecurringRule, 'id' | 'active'> & { active?: boolean }): string {
    const id = generateId()
    const item: RecurringRule = {
      ...data,
      active: data.active ?? true,
      id,
    }
    rules.value[id] = item

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('recurring_rules').insert({
        active: item.active,
        amount: item.amount,
        category_id: item.categoryId,
        created_at: new Date().toISOString(),
        day_of_month: item.dayOfMonth ?? null,
        frequency: item.frequency,
        id,
        next_run_date: toIsoDate(item.nextRunDate),
        note: encodeRuleNote(item),
        type: item.type,
        user_id: currentUid,
      }).then(({ error }) => {
        if (error)
          logger.error('Failed to insert recurring rule in Supabase', error)
      })
    }

    return id
  }

  function updateRule(id: string, data: Partial<Omit<RecurringRule, 'id'>>) {
    const resolvedId = legacyIdMap.value[id] || id
    if (!rules.value[resolvedId])
      return

    rules.value[resolvedId] = { ...rules.value[resolvedId], ...data }
    const updated = rules.value[resolvedId]

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('recurring_rules').update({
        active: updated.active,
        amount: updated.amount,
        category_id: updated.categoryId,
        day_of_month: updated.dayOfMonth ?? null,
        frequency: updated.frequency,
        next_run_date: toIsoDate(updated.nextRunDate),
        note: encodeRuleNote(updated),
        type: updated.type,
      }).eq('id', resolvedId).then(({ error }) => {
        if (error)
          logger.error('Failed to update recurring rule in Supabase', error)
      })
    }
  }

  function deleteRule(id: string) {
    const resolvedId = legacyIdMap.value[id] || id
    delete rules.value[resolvedId]

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('recurring_rules').delete().eq('id', resolvedId).then(({ error }) => {
        if (error)
          logger.error('Failed to delete recurring rule in Supabase', error)
      })
    }
  }

  function toggleActive(id: string) {
    const resolvedId = legacyIdMap.value[id] || id
    if (!rules.value[resolvedId])
      return
    rules.value[resolvedId].active = !rules.value[resolvedId].active
    updateRule(resolvedId, { active: rules.value[resolvedId].active })
  }

  async function executeRule(id: string) {
    const resolvedId = legacyIdMap.value[id] || id
    const rule = rules.value[resolvedId]
    if (!rule)
      return

    const trnsStore = useTrnsStore()
    const trnId = generateId()
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
    updateRule(resolvedId, { nextRunDate: rule.nextRunDate })
  }

  function seedSampleRules(walletId?: string, categoryId?: string, currency: string = 'USD') {
    if (Object.keys(rules.value).length > 0)
      return

    const defaultWalletId = walletId || 'wallet-1'
    const defaultCategoryId = categoryId || 'category-1'
    const now = Date.now()
    const dayMs = 86400000

    addRule({
      amount: 19.99,
      categoryId: defaultCategoryId,
      currency,
      dayOfMonth: 1,
      frequency: 'monthly',
      name: 'Netflix Premium',
      nextRunDate: now + dayMs * 4,
      note: 'Family 4K plan',
      type: TrnType.Expense,
      walletId: defaultWalletId,
    })

    addRule({
      amount: 45,
      categoryId: defaultCategoryId,
      currency,
      dayOfMonth: 15,
      frequency: 'monthly',
      name: 'Gym Membership',
      nextRunDate: now + dayMs * 12,
      note: 'Fitness club',
      type: TrnType.Expense,
      walletId: defaultWalletId,
    })

    addRule({
      amount: 3500,
      categoryId: defaultCategoryId,
      currency,
      dayOfMonth: 28,
      frequency: 'monthly',
      name: 'Monthly Salary',
      nextRunDate: now + dayMs * 18,
      note: 'Direct deposit',
      type: TrnType.Income,
      walletId: defaultWalletId,
    })
  }

  return {
    activeRules,
    addRule,
    calculateNextDate,
    deleteRule,
    executeRule,
    fetchFromSupabase,
    init,
    isLoaded,
    isSyncing,
    legacyIdMap,
    monthlyExpenseEstimate,
    rules,
    rulesList,
    seedSampleRules,
    toggleActive,
    updateRule,
  }
})
