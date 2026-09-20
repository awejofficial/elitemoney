import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useTrnsStore } from '~/components/trns/useTrnsStore'
import { TrnType } from '~/components/trns/types'

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

export interface TabDayLog {
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

export const useTabsStore = defineStore('dailyTabs', () => {
  const tabs = useStorage<Record<string, DailyTabItem>>('elitemoney.dailyTabs', {})
  // Keyed by `${tabId}_${date}`
  const logs = useStorage<Record<string, TabDayLog>>('elitemoney.dailyTabLogs', {})
  const settlements = useStorage<Record<string, TabSettlement>>('elitemoney.dailyTabSettlements', {})

  const tabsList = computed<DailyTabItem[]>(() =>
    Object.values(tabs.value).sort((a, b) => b.createdAt - a.createdAt),
  )

  function getTodayKey(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function getLogKey(tabId: string, dateKey: string): string {
    return `${tabId}_${dateKey}`
  }

  function getDayLog(tabId: string, dateKey: string): TabDayLog {
    const key = getLogKey(tabId, dateKey)
    if (logs.value[key])
      return logs.value[key]

    // Default to the tab's default configuration
    const tab = tabs.value[tabId]
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
      total = tab.defaultUnitsPerDay
    }

    return {
      date: dateKey,
      totalUnits: total,
      slots: defaultSlots,
    }
  }

  function setDayLog(tabId: string, dateKey: string, data: Partial<TabDayLog>) {
    const key = getLogKey(tabId, dateKey)
    const existing = getDayLog(tabId, dateKey)
    logs.value[key] = {
      ...existing,
      ...data,
      date: dateKey,
    }
  }

  function quickToggleSlot(tabId: string, dateKey: string, slotId: string) {
    const tab = tabs.value[tabId]
    if (!tab)
      return

    const existing = getDayLog(tabId, dateKey)
    const currentSlotVal = existing.slots?.[slotId] ?? 1
    // Cycle between: 1 -> 0 (skipped) -> 2 (extra) -> 1
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

    setDayLog(tabId, dateKey, {
      slots: updatedSlots,
      totalUnits: newTotal,
    })
  }

  function adjustTotalUnits(tabId: string, dateKey: string, delta: number) {
    const existing = getDayLog(tabId, dateKey)
    const newTotal = Math.max(0, existing.totalUnits + delta)
    setDayLog(tabId, dateKey, { totalUnits: newTotal })
  }

  function addTab(data: Omit<DailyTabItem, 'id' | 'createdAt'>): string {
    const id = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    tabs.value[id] = {
      ...data,
      id,
      createdAt: Date.now(),
    }
    return id
  }

  function updateTab(id: string, data: Partial<Omit<DailyTabItem, 'id' | 'createdAt'>>) {
    if (!tabs.value[id])
      return
    tabs.value[id] = { ...tabs.value[id], ...data }
  }

  function deleteTab(id: string) {
    delete tabs.value[id]
    // Clean up logs associated with this tab
    for (const key of Object.keys(logs.value)) {
      if (key.startsWith(`${id}_`))
        delete logs.value[key]
    }
  }

  function calculateMonthSummary(tabId: string, yearMonth: string) {
    const tab = tabs.value[tabId]
    if (!tab) {
      return {
        totalUnits: 0,
        totalAmount: 0,
        attendedDays: 0,
        skippedUnits: 0,
        savedAmount: 0,
        daysCount: 0,
        isSettled: false,
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
      const log = getDayLog(tabId, dateKey)
      totalUnits += log.totalUnits
      if (log.totalUnits > 0)
        attendedDays++

      const defaultPerDay = tab.slots?.length ? tab.slots.reduce((a, s) => a + s.defaultCount, 0) : tab.defaultUnitsPerDay
      potentialUnits += defaultPerDay
    }

    const skippedUnits = Math.max(0, potentialUnits - totalUnits)
    const totalAmount = totalUnits * tab.unitPrice
    const savedAmount = skippedUnits * tab.unitPrice
    const settlementKey = `${tabId}_${yearMonth}`
    const isSettled = !!settlements.value[settlementKey]

    return {
      totalUnits,
      totalAmount,
      attendedDays,
      skippedUnits,
      savedAmount,
      daysCount: maxDay,
      isSettled,
      settlement: settlements.value[settlementKey],
    }
  }

  function settleMonth(tabId: string, yearMonth: string, walletId: string, categoryId?: string) {
    const tab = tabs.value[tabId]
    if (!tab)
      return

    const summary = calculateMonthSummary(tabId, yearMonth)
    if (summary.totalAmount <= 0)
      return

    const trnsStore = useTrnsStore()
    const trnId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

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

    const settlementKey = `${tabId}_${yearMonth}`
    settlements.value[settlementKey] = {
      id: settlementKey,
      tabId,
      monthYear: yearMonth,
      totalUnits: summary.totalUnits,
      totalAmount: summary.totalAmount,
      settledAt: Date.now(),
      walletId,
      categoryId,
      trnId,
    }
  }

  function generateShareSlip(tabId: string, yearMonth: string): string {
    const tab = tabs.value[tabId]
    if (!tab)
      return ''

    const [yearStr, monthStr] = yearMonth.split('-')
    const year = Number(yearStr) || new Date().getFullYear()
    const month = Number(monthStr) || (new Date().getMonth() + 1)
    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const summary = calculateMonthSummary(tabId, yearMonth)

    const skippedDaysList: string[] = []
    const daysInMonth = new Date(year, month, 0).getDate()
    const isCurrentMonth = getTodayKey().startsWith(yearMonth)
    const maxDay = isCurrentMonth ? new Date().getDate() : daysInMonth

    for (let d = 1; d <= maxDay; d++) {
      const dateKey = `${yearMonth}-${String(d).padStart(2, '0')}`
      const log = getDayLog(tabId, dateKey)
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
      name: 'College Mess (Tiffin)',
      categoryType: 'mess',
      unitLabel: 'tiffin',
      unitPrice: 70,
      currency,
      defaultUnitsPerDay: 2,
      slots: [
        { id: 'lunch', label: 'Lunch', defaultCount: 1 },
        { id: 'dinner', label: 'Dinner', defaultCount: 1 },
      ],
      defaultWalletId: walletId,
      defaultCategoryId: categoryId,
      icon: 'lucide:utensils',
      color: '#f97316',
    })

    // Seed some logs for the current month so the user sees a realistic demonstration
    const d = new Date()
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const day = d.getDate()

    for (let i = 1; i <= Math.min(day, 20); i++) {
      const dateKey = `${ym}-${String(i).padStart(2, '0')}`
      if (i === 5 || i === 12) {
        setDayLog(id, dateKey, {
          slots: { lunch: 1, dinner: 0 },
          totalUnits: 1,
          note: 'Out with friends',
        })
      }
      else if (i === 8) {
        setDayLog(id, dateKey, {
          slots: { lunch: 0, dinner: 0 },
          totalUnits: 0,
          note: 'Holiday / at home',
        })
      }
      else {
        setDayLog(id, dateKey, {
          slots: { lunch: 1, dinner: 1 },
          totalUnits: 2,
        })
      }
    }
  }

  return {
    tabs,
    tabsList,
    logs,
    settlements,
    getTodayKey,
    getDayLog,
    setDayLog,
    quickToggleSlot,
    adjustTotalUnits,
    addTab,
    updateTab,
    deleteTab,
    calculateMonthSummary,
    settleMonth,
    generateShareSlip,
    seedSampleTab,
  }
})
