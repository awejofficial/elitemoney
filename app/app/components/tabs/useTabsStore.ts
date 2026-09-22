import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSupabase, useSupabaseAuth } from '~/composables/useSupabase'
import { useTrnsStore } from '~/components/trns/useTrnsStore'
import { TrnType } from '~/components/trns/types'
import { createLogger } from '~/utils/logger'

const logger = createLogger('tabs-store')

export interface TabSlot {
  id: string
  label: string
  defaultCount: number
}

export interface DailyTabItem {
  id: string
  name: string
  categoryType: 'mess' | 'milk' | 'water' | 'maid' | 'custom'
  unitLabel: string
  unitPrice: number
  currency: string
  defaultUnitsPerDay: number
  slots: TabSlot[]
  defaultWalletId?: string
  defaultCategoryId?: string
  icon: string
  color: string
  createdAt: number
}

export type AddTabInput = Omit<DailyTabItem, 'id' | 'createdAt' | 'slots' | 'defaultUnitsPerDay' | 'icon'> & {
  slots?: TabSlot[]
  defaultUnitsPerDay?: number
  icon?: string
}

export interface TabDayLog {
  id?: string
  date: string // "YYYY-MM-DD"
  totalUnits: number
  slots?: Record<string, number> // slotId -> count
  note?: string
}

export interface TabSettlement {
  id: string
  tabId: string
  monthYear: string // "YYYY-MM"
  totalUnits: number
  totalAmount: number
  settledAt: number
  walletId: string
  categoryId?: string
  trnId?: string
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

function parseSlots(val: unknown): { slots: TabSlot[], defaultUnitsPerDay?: number } {
  if (!val)
    return { slots: [] }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed))
        return { slots: parsed }
      if (typeof parsed === 'object' && parsed !== null)
        return { defaultUnitsPerDay: parsed.defaultUnitsPerDay, slots: parsed.slots || [] }
    }
    catch {
      return { slots: [] }
    }
  }
  if (Array.isArray(val))
    return { slots: val as TabSlot[] }
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, any>
    return { defaultUnitsPerDay: obj.defaultUnitsPerDay, slots: obj.slots || [] }
  }
  return { slots: [] }
}

function parseLogSlots(val: unknown): Record<string, number> {
  if (!val)
    return {}
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    }
    catch {
      return {}
    }
  }
  if (typeof val === 'object' && val !== null)
    return val as Record<string, number>
  return {}
}

export const useTabsStore = defineStore('dailyTabs', () => {
  const tabs = useStorage<Record<string, DailyTabItem>>('elitemoney.dailyTabs', {})
  // Keyed by `${tabId}_${date}`
  const logs = useStorage<Record<string, TabDayLog>>('elitemoney.dailyTabLogs', {})
  const settlements = useStorage<Record<string, TabSettlement>>('elitemoney.dailyTabSettlements', {})

  const legacyIdMap = ref<Record<string, string>>({})
  const isSyncing = ref(false)
  const isLoaded = ref(false)

  const supabase = useSupabase()
  const { uid } = useSupabaseAuth()

  let realtimeChannel: any = null

  const tabsList = computed<DailyTabItem[]>(() =>
    Object.values(tabs.value).sort((a, b) => b.createdAt - a.createdAt),
  )

  function getTodayKey(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function getLogKey(tabId: string, dateKey: string): string {
    const resolvedId = legacyIdMap.value[tabId] || tabId
    return `${resolvedId}_${dateKey}`
  }

  function getDayLog(tabId: string, dateKey: string): TabDayLog {
    const key = getLogKey(tabId, dateKey)
    if (logs.value[key])
      return logs.value[key]

    const resolvedId = legacyIdMap.value[tabId] || tabId
    const tab = tabs.value[resolvedId]
    if (!tab) {
      return { date: dateKey, totalUnits: 0 }
    }

    const defaultSlots: Record<string, number> = {}
    let total = 0
    if (tab.slots && tab.slots.length > 0) {
      for (const s of tab.slots) {
        defaultSlots[s.id] = s.defaultCount
        total += s.defaultCount
      }
    }
    else {
      total = tab.defaultUnitsPerDay ?? 1
    }

    return {
      date: dateKey,
      slots: defaultSlots,
      totalUnits: total,
    }
  }

  function setDayLog(tabId: string, dateKey: string, data: Partial<TabDayLog>) {
    const resolvedId = legacyIdMap.value[tabId] || tabId
    const key = getLogKey(resolvedId, dateKey)
    const existing = getDayLog(resolvedId, dateKey)
    const updated: TabDayLog = {
      ...existing,
      ...data,
      date: dateKey,
      id: existing.id || generateId(),
    }
    logs.value[key] = updated

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('daily_tab_logs').upsert({
        date: dateKey,
        id: updated.id,
        note: updated.note ?? null,
        slots: updated.slots || {},
        tab_id: resolvedId,
        total_units: updated.totalUnits,
        updated_at: new Date().toISOString(),
        user_id: currentUid,
      }).then(({ error }) => {
        if (error)
          logger.error('Failed to upsert tab log in Supabase', error)
      })
    }
  }

  function quickToggleSlot(tabId: string, dateKey: string, slotId: string) {
    const resolvedId = legacyIdMap.value[tabId] || tabId
    const tab = tabs.value[resolvedId]
    if (!tab)
      return

    const existing = getDayLog(resolvedId, dateKey)
    const currentSlotVal = existing.slots?.[slotId] ?? 1
    let nextVal = 0
    if (currentSlotVal === 1)
      nextVal = 0
    else if (currentSlotVal === 0)
      nextVal = 2
    else
      nextVal = 1

    const updatedSlots = { ...(existing.slots || {}), [slotId]: nextVal }
    let newTotal = 0
    for (const val of Object.values(updatedSlots)) {
      newTotal += val
    }

    setDayLog(resolvedId, dateKey, {
      slots: updatedSlots,
      totalUnits: newTotal,
    })
  }

  function adjustTotalUnits(tabId: string, dateKey: string, delta: number) {
    const resolvedId = legacyIdMap.value[tabId] || tabId
    const existing = getDayLog(resolvedId, dateKey)
    const newTotal = Math.max(0, existing.totalUnits + delta)
    setDayLog(resolvedId, dateKey, { totalUnits: newTotal })
  }

  async function migrateLocalTabsToSupabase(currentUid: string) {
    const localTabs = { ...tabs.value }
    const localLogs = { ...logs.value }
    const localSettlements = { ...settlements.value }
    let hasChanges = false

    const tabRemap: Record<string, string> = {}

    for (const [id, t] of Object.entries(localTabs)) {
      let activeId = id
      if (!isUuid(id)) {
        activeId = generateId()
        tabRemap[id] = activeId
        legacyIdMap.value[id] = activeId
        localTabs[activeId] = { ...t, id: activeId }
        delete localTabs[id]
        hasChanges = true
      }

      try {
        await supabase.from('daily_tabs').upsert({
          category_type: t.categoryType,
          color: t.color,
          created_at: new Date(t.createdAt).toISOString(),
          currency: t.currency,
          default_category_id: t.defaultCategoryId ?? null,
          default_wallet_id: t.defaultWalletId ?? null,
          icon: t.icon,
          id: activeId,
          name: t.name,
          slots: { defaultUnitsPerDay: t.defaultUnitsPerDay, slots: t.slots },
          unit_label: t.unitLabel,
          unit_price: t.unitPrice,
          user_id: currentUid,
        })
      }
      catch (err) {
        logger.error('Failed to sync migrated daily tab', t.name, err)
      }
    }

    for (const [key, l] of Object.entries(localLogs)) {
      const parts = key.split('_')
      const oldTabId = parts[0] || ''
      const date = parts.slice(1).join('_')
      const resolvedTabId = (oldTabId && tabRemap[oldTabId]) || oldTabId

      const logId = l.id && isUuid(l.id) ? l.id : generateId()
      localLogs[`${resolvedTabId}_${date}`] = { ...l, id: logId }
      if (resolvedTabId !== oldTabId) {
        delete localLogs[key]
        hasChanges = true
      }

      try {
        await supabase.from('daily_tab_logs').upsert({
          date,
          id: logId,
          note: l.note ?? null,
          slots: l.slots || {},
          tab_id: resolvedTabId,
          total_units: l.totalUnits,
          updated_at: new Date().toISOString(),
          user_id: currentUid,
        })
      }
      catch (err) {
        logger.error('Failed to sync migrated tab log', key, err)
      }
    }

    for (const [key, s] of Object.entries(localSettlements)) {
      const parts = key.split('_')
      const oldTabId = parts[0] || ''
      const yearMonth = parts.slice(1).join('_')
      const resolvedTabId = (oldTabId && tabRemap[oldTabId]) || oldTabId
      const newKey = `${resolvedTabId}_${yearMonth}`

      localSettlements[newKey] = { ...s, id: newKey, tabId: resolvedTabId }
      if (newKey !== key) {
        delete localSettlements[key]
        hasChanges = true
      }

      try {
        await supabase.from('daily_tab_settlements').upsert({
          category_id: s.categoryId || null,
          id: newKey,
          settled_at: s.settledAt || Date.now(),
          tab_id: resolvedTabId,
          total_amount: s.totalAmount,
          total_units: s.totalUnits ?? null,
          trn_id: s.trnId || null,
          user_id: currentUid,
          wallet_id: s.walletId || null,
          year_month: s.monthYear || yearMonth,
        })
      }
      catch (err) {
        logger.error('Failed to sync migrated tab settlement', key, err)
      }
    }

    if (hasChanges) {
      tabs.value = localTabs
      logs.value = localLogs
      settlements.value = localSettlements
    }
  }

  async function fetchFromSupabase() {
    const currentUid = uid.value
    if (!currentUid)
      return

    isSyncing.value = true
    try {
      const [tabsRes, logsRes, settlementsRes] = await Promise.all([
        supabase.from('daily_tabs').select('*').order('created_at', { ascending: true }),
        supabase.from('daily_tab_logs').select('*'),
        supabase.from('daily_tab_settlements').select('*'),
      ])

      if (tabsRes.error) {
        logger.error('Error fetching daily tabs from Supabase', tabsRes.error)
      }
      else if (tabsRes.data) {
        const nextTabs: Record<string, DailyTabItem> = {}
        for (const row of tabsRes.data) {
          const parsedSlots = parseSlots(row.slots)
          nextTabs[row.id] = {
            categoryType: row.category_type || 'custom',
            color: row.color || '#3b82f6',
            createdAt: new Date(row.created_at).getTime(),
            currency: row.currency || 'USD',
            defaultCategoryId: row.default_category_id || undefined,
            defaultUnitsPerDay: parsedSlots.defaultUnitsPerDay ?? 1,
            defaultWalletId: row.default_wallet_id || undefined,
            icon: row.icon || 'lucide:calendar',
            id: row.id,
            name: row.name,
            slots: parsedSlots.slots,
            unitLabel: row.unit_label || 'unit',
            unitPrice: Number(row.unit_price) || 0,
          }
        }

        if (tabsRes.data.length === 0 && Object.keys(tabs.value).length > 0) {
          await migrateLocalTabsToSupabase(currentUid)
        }
        else {
          tabs.value = { ...tabs.value, ...nextTabs }
        }
      }

      if (logsRes.error) {
        logger.error('Error fetching daily tab logs from Supabase', logsRes.error)
      }
      else if (logsRes.data) {
        const nextLogs: Record<string, TabDayLog> = {}
        for (const row of logsRes.data) {
          const key = `${row.tab_id}_${row.date}`
          nextLogs[key] = {
            date: row.date,
            id: row.id,
            note: row.note || undefined,
            slots: parseLogSlots(row.slots),
            totalUnits: Number(row.total_units) || 0,
          }
        }

        if (logsRes.data.length === 0 && Object.keys(logs.value).length > 0) {
          await migrateLocalTabsToSupabase(currentUid)
        }
        else {
          logs.value = { ...logs.value, ...nextLogs }
        }
      }

      if (settlementsRes?.error) {
        logger.error('Error fetching daily tab settlements from Supabase', settlementsRes.error)
      }
      else if (settlementsRes?.data) {
        const nextSettlements: Record<string, TabSettlement> = {}
        for (const row of settlementsRes.data) {
          nextSettlements[row.id] = {
            categoryId: row.category_id || undefined,
            id: row.id,
            monthYear: row.year_month,
            settledAt: Number(row.settled_at) || Date.now(),
            tabId: row.tab_id,
            totalAmount: Number(row.total_amount) || 0,
            totalUnits: Number(row.total_units) || 0,
            trnId: row.trn_id || undefined,
            walletId: row.wallet_id || '',
          }
        }

        if (settlementsRes.data.length === 0 && Object.keys(settlements.value).length > 0) {
          await migrateLocalTabsToSupabase(currentUid)
        }
        else {
          settlements.value = { ...settlements.value, ...nextSettlements }
        }
      }

      isLoaded.value = true
    }
    catch (err) {
      logger.error('Unexpected error fetching daily tabs', err)
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
      .channel('realtime:daily_tabs')
      .on(
        'postgres_changes',
        { event: '*', filter: `user_id=eq.${currentUid}`, schema: 'public', table: 'daily_tabs' },
        (payload) => {
          logger.log('Realtime daily_tabs change received', payload.eventType)
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            delete tabs.value[payload.old.id]
          }
          else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const row = payload.new
            const parsedSlots = parseSlots(row.slots)
            tabs.value[row.id] = {
              categoryType: row.category_type || 'custom',
              color: row.color || '#3b82f6',
              createdAt: new Date(row.created_at).getTime(),
              currency: row.currency || 'USD',
              defaultCategoryId: row.default_category_id || undefined,
              defaultUnitsPerDay: parsedSlots.defaultUnitsPerDay ?? 1,
              defaultWalletId: row.default_wallet_id || undefined,
              icon: row.icon || 'lucide:calendar',
              id: row.id,
              name: row.name,
              slots: parsedSlots.slots,
              unitLabel: row.unit_label || 'unit',
              unitPrice: Number(row.unit_price) || 0,
            }
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', filter: `user_id=eq.${currentUid}`, schema: 'public', table: 'daily_tab_logs' },
        (payload) => {
          logger.log('Realtime daily_tab_logs change received', payload.eventType)
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            for (const [k, v] of Object.entries(logs.value)) {
              if (v.id === payload.old.id)
                delete logs.value[k]
            }
          }
          else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const row = payload.new
            const key = `${row.tab_id}_${row.date}`
            logs.value[key] = {
              date: row.date,
              id: row.id,
              note: row.note || undefined,
              slots: parseLogSlots(row.slots),
              totalUnits: Number(row.total_units) || 0,
            }
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', filter: `user_id=eq.${currentUid}`, schema: 'public', table: 'daily_tab_settlements' },
        (payload) => {
          logger.log('Realtime daily_tab_settlements change received', payload.eventType)
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            delete settlements.value[payload.old.id]
          }
          else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const row = payload.new
            settlements.value[row.id] = {
              categoryId: row.category_id || undefined,
              id: row.id,
              monthYear: row.year_month,
              settledAt: Number(row.settled_at) || Date.now(),
              tabId: row.tab_id,
              totalAmount: Number(row.total_amount) || 0,
              totalUnits: Number(row.total_units) || 0,
              trnId: row.trn_id || undefined,
              walletId: row.wallet_id || '',
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

  function addTab(data: AddTabInput): string {
    const id = generateId()
    const item: DailyTabItem = {
      defaultUnitsPerDay: data.defaultUnitsPerDay ?? 1,
      icon: data.icon || 'lucide:calendar',
      slots: data.slots || [],
      ...data,
      createdAt: Date.now(),
      id,
    }
    tabs.value[id] = item

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('daily_tabs').insert({
        category_type: item.categoryType,
        color: item.color,
        created_at: new Date(item.createdAt).toISOString(),
        currency: item.currency,
        default_category_id: item.defaultCategoryId ?? null,
        default_wallet_id: item.defaultWalletId ?? null,
        icon: item.icon,
        id,
        name: item.name,
        slots: { defaultUnitsPerDay: item.defaultUnitsPerDay, slots: item.slots },
        unit_label: item.unitLabel,
        unit_price: item.unitPrice,
        user_id: currentUid,
      }).then(({ error }) => {
        if (error)
          logger.error('Failed to insert daily tab to Supabase', error)
      })
    }

    return id
  }

  function updateTab(id: string, data: Partial<Omit<DailyTabItem, 'id' | 'createdAt'>>) {
    const resolvedId = legacyIdMap.value[id] || id
    if (!tabs.value[resolvedId])
      return

    tabs.value[resolvedId] = { ...tabs.value[resolvedId], ...data }
    const updated = tabs.value[resolvedId]

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('daily_tabs').update({
        category_type: updated.categoryType,
        color: updated.color,
        currency: updated.currency,
        default_category_id: updated.defaultCategoryId ?? null,
        default_wallet_id: updated.defaultWalletId ?? null,
        icon: updated.icon,
        name: updated.name,
        slots: { defaultUnitsPerDay: updated.defaultUnitsPerDay, slots: updated.slots },
        unit_label: updated.unitLabel,
        unit_price: updated.unitPrice,
      }).eq('id', resolvedId).then(({ error }) => {
        if (error)
          logger.error('Failed to update daily tab in Supabase', error)
      })
    }
  }

  function deleteTab(id: string) {
    const resolvedId = legacyIdMap.value[id] || id
    delete tabs.value[resolvedId]
    for (const key of Object.keys(logs.value)) {
      if (key.startsWith(`${resolvedId}_`) || key.startsWith(`${id}_`))
        delete logs.value[key]
    }
    for (const key of Object.keys(settlements.value)) {
      if (key.startsWith(`${resolvedId}_`) || key.startsWith(`${id}_`))
        delete settlements.value[key]
    }

    const currentUid = uid.value
    if (currentUid) {
      void (async () => {
        try {
          await supabase.from('daily_tab_settlements').delete().eq('tab_id', resolvedId)
          await supabase.from('daily_tab_logs').delete().eq('tab_id', resolvedId)
          await supabase.from('daily_tabs').delete().eq('id', resolvedId)
        }
        catch (err) {
          logger.error('Failed to delete daily tab in Supabase', err)
        }
      })()
    }
  }

  function calculateMonthSummary(tabId: string, yearMonth: string) {
    const resolvedId = legacyIdMap.value[tabId] || tabId
    const tab = tabs.value[resolvedId]
    if (!tab) {
      return {
        attendedDays: 0,
        daysCount: 0,
        isSettled: false,
        savedAmount: 0,
        skippedUnits: 0,
        totalAmount: 0,
        totalUnits: 0,
      }
    }

    const [yearStr, monthStr] = yearMonth.split('-')
    const year = Number(yearStr) || new Date().getFullYear()
    const month = Number(monthStr) || (new Date().getMonth() + 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const isCurrentMonth = getTodayKey().startsWith(yearMonth)
    const maxDay = isCurrentMonth ? new Date().getDate() : daysInMonth

    let totalUnits = 0
    let attendedDays = 0
    let potentialUnits = 0

    for (let d = 1; d <= maxDay; d++) {
      const dateKey = `${yearMonth}-${String(d).padStart(2, '0')}`
      const log = getDayLog(resolvedId, dateKey)
      totalUnits += log.totalUnits
      if (log.totalUnits > 0)
        attendedDays++

      const defaultPerDay = tab.slots?.length ? tab.slots.reduce((a, s) => a + s.defaultCount, 0) : (tab.defaultUnitsPerDay ?? 1)
      potentialUnits += defaultPerDay
    }

    const skippedUnits = Math.max(0, potentialUnits - totalUnits)
    const totalAmount = totalUnits * tab.unitPrice
    const savedAmount = skippedUnits * tab.unitPrice
    const settlementKey = `${resolvedId}_${yearMonth}`
    const isSettled = !!settlements.value[settlementKey]

    return {
      attendedDays,
      daysCount: maxDay,
      isSettled,
      savedAmount,
      settlement: settlements.value[settlementKey],
      skippedUnits,
      totalAmount,
      totalUnits,
    }
  }

  function settleMonth(tabId: string, yearMonth: string, walletId: string, categoryId?: string) {
    const resolvedId = legacyIdMap.value[tabId] || tabId
    const tab = tabs.value[resolvedId]
    if (!tab)
      return

    const summary = calculateMonthSummary(resolvedId, yearMonth)
    if (summary.totalAmount <= 0)
      return

    const trnsStore = useTrnsStore()
    const trnId = generateId()

    const [year, month] = yearMonth.split('-')
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'short' })
    const desc = `[Daily Tab] ${tab.name} — ${monthName} ${year} (${summary.totalUnits} ${tab.unitLabel}s @ ${tab.currency} ${tab.unitPrice})`

    trnsStore.saveTrn({
      id: trnId,
      values: {
        amount: summary.totalAmount,
        categoryId: categoryId || tab.defaultCategoryId || 'category-food',
        date: Date.now(),
        desc,
        type: TrnType.Expense,
        updatedAt: Date.now(),
        walletId,
      },
    })

    const settlementKey = `${resolvedId}_${yearMonth}`
    const settlementItem: TabSettlement = {
      categoryId,
      id: settlementKey,
      monthYear: yearMonth,
      settledAt: Date.now(),
      tabId: resolvedId,
      totalAmount: summary.totalAmount,
      totalUnits: summary.totalUnits,
      trnId,
      walletId,
    }
    settlements.value[settlementKey] = settlementItem

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('daily_tab_settlements').upsert({
        category_id: categoryId || null,
        id: settlementKey,
        settled_at: settlementItem.settledAt,
        tab_id: resolvedId,
        total_amount: summary.totalAmount,
        total_units: summary.totalUnits,
        trn_id: trnId,
        user_id: currentUid,
        wallet_id: walletId,
        year_month: yearMonth,
      }).then(({ error }) => {
        if (error)
          logger.error('Failed to sync settlement to Supabase', error)
      })
    }
  }

  function generateShareSlip(tabId: string, yearMonth: string): string {
    const resolvedId = legacyIdMap.value[tabId] || tabId
    const tab = tabs.value[resolvedId]
    if (!tab)
      return ''

    const [yearStr, monthStr] = yearMonth.split('-')
    const year = Number(yearStr) || new Date().getFullYear()
    const month = Number(monthStr) || (new Date().getMonth() + 1)
    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const summary = calculateMonthSummary(resolvedId, yearMonth)

    const skippedDaysList: string[] = []
    const daysInMonth = new Date(year, month, 0).getDate()
    const isCurrentMonth = getTodayKey().startsWith(yearMonth)
    const maxDay = isCurrentMonth ? new Date().getDate() : daysInMonth

    for (let d = 1; d <= maxDay; d++) {
      const dateKey = `${yearMonth}-${String(d).padStart(2, '0')}`
      const log = getDayLog(resolvedId, dateKey)
      const dayFormatted = `${monthName.slice(0, 3)} ${d}`

      if (log.totalUnits === 0) {
        skippedDaysList.push(`${dayFormatted} (Skipped full day${log.note ? `: ${log.note}` : ''})`)
      }
      else if (tab.slots && tab.slots.length > 0) {
        for (const s of tab.slots) {
          if ((log.slots?.[s.id] ?? s.defaultCount) === 0) {
            skippedDaysList.push(`${dayFormatted} (${s.label} skipped)`)
          }
        }
      }
    }

    const lines = [
      `📋 *${tab.name} — Monthly Bill Summary*`,
      `📅 *Month:* ${monthName}`,
      `💰 *Rate:* ${tab.currency} ${tab.unitPrice} / ${tab.unitLabel}`,
      `---------------------------------`,
      `✅ *Total ${tab.unitLabel}s Consumed:* ${summary.totalUnits}`,
      `🗓️ *Days Attended:* ${summary.attendedDays} / ${maxDay} days`,
    ]

    if (skippedDaysList.length > 0) {
      lines.push(`❌ *Skipped Dates:*`)
      for (const skip of skippedDaysList.slice(0, 15)) {
        lines.push(`   • ${skip}`)
      }
      if (skippedDaysList.length > 15) {
        lines.push(`   • ... and ${skippedDaysList.length - 15} more skipped slots`)
      }
    }

    lines.push(`---------------------------------`)
    lines.push(`💵 *Total Amount Payable:* ${tab.currency} ${summary.totalAmount.toLocaleString()}`)
    lines.push(`📱 *Generated via EliteMoney*`)

    return lines.join('\n')
  }

  function seedSampleTab(walletId?: string, categoryId?: string, currency: string = 'INR') {
    if (Object.keys(tabs.value).length > 0)
      return

    const id = addTab({
      categoryType: 'mess',
      color: '#f97316',
      currency,
      defaultCategoryId: categoryId,
      defaultUnitsPerDay: 2,
      defaultWalletId: walletId,
      icon: 'lucide:utensils',
      name: 'College Mess (Tiffin)',
      slots: [
        { defaultCount: 1, id: 'lunch', label: 'Lunch' },
        { defaultCount: 1, id: 'dinner', label: 'Dinner' },
      ],
      unitLabel: 'tiffin',
      unitPrice: 70,
    })

    const d = new Date()
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const day = d.getDate()

    for (let i = 1; i <= Math.min(day, 20); i++) {
      const dateKey = `${ym}-${String(i).padStart(2, '0')}`
      if (i === 5 || i === 12) {
        setDayLog(id, dateKey, {
          note: 'Out with friends',
          slots: { dinner: 0, lunch: 1 },
          totalUnits: 1,
        })
      }
      else if (i === 8) {
        setDayLog(id, dateKey, {
          note: 'Holiday / at home',
          slots: { dinner: 0, lunch: 0 },
          totalUnits: 0,
        })
      }
      else {
        setDayLog(id, dateKey, {
          slots: { dinner: 1, lunch: 1 },
          totalUnits: 2,
        })
      }
    }
  }

  return {
    addTab,
    adjustTotalUnits,
    calculateMonthSummary,
    deleteTab,
    fetchFromSupabase,
    generateShareSlip,
    getDayLog,
    getTodayKey,
    init,
    isLoaded,
    isSyncing,
    legacyIdMap,
    logs,
    quickToggleSlot,
    seedSampleTab,
    setDayLog,
    settleMonth,
    settlements,
    tabs,
    tabsList,
    updateTab,
  }
})
