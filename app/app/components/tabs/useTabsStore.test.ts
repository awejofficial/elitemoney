import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTabsStore } from './useTabsStore'

const h = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ error: null })
  const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const deleteMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const selectMock = vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  })
  const fromMock = vi.fn().mockImplementation((_table: string) => ({
    delete: deleteMock,
    insert: insertMock,
    select: selectMock,
    update: updateMock,
    upsert: vi.fn().mockResolvedValue({ error: null }),
  }))
  const channelMock = vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  })

  return {
    auth: { session: { value: null }, signOut: vi.fn(), uid: { value: 'u1' }, user: { value: null } },
    channelMock,
    deleteMock,
    fromMock,
    insertMock,
    selectMock,
    updateMock,
  }
})

vi.mock('~/composables/useSupabase', () => ({
  useSupabase: () => ({
    channel: h.channelMock,
    from: h.fromMock,
  }),
  useSupabaseAuth: () => h.auth,
}))

vi.mock('~/components/trns/useTrnsStore', () => ({
  useTrnsStore: () => ({
    saveTrn: vi.fn(),
  }),
}))

describe('useTabsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('generates valid UUIDs when adding a daily tab', () => {
    const store = useTabsStore()
    const id = store.addTab({
      categoryType: 'mess',
      color: '#3b82f6',
      currency: 'INR',
      name: 'College Mess',
      unitLabel: 'meal',
      unitPrice: 50,
    })

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(store.tabs[id]).toBeDefined()
    expect(store.tabs[id]?.name).toBe('College Mess')
    expect(h.fromMock).toHaveBeenCalledWith('daily_tabs')
  })

  it('logs attendance and updates day log properly', () => {
    const store = useTabsStore()
    const tabId = store.addTab({
      categoryType: 'mess',
      color: '#3b82f6',
      currency: 'INR',
      name: 'Office Tiffin',
      unitLabel: 'tiffin',
      unitPrice: 80,
    })

    store.setDayLog(tabId, '2026-09-22', {
      note: 'Extra lunch for guest',
      slots: { lunch: 2 },
      totalUnits: 2,
    })
    const log = store.getDayLog(tabId, '2026-09-22')

    expect(log.totalUnits).toBe(2)
    expect(log.note).toBe('Extra lunch for guest')
    expect(h.fromMock).toHaveBeenCalledWith('daily_tab_logs')
  })

  it('calculates monthly summary and settles month to Supabase', () => {
    const store = useTabsStore()
    const tabId = store.addTab({
      categoryType: 'mess',
      color: '#3b82f6',
      currency: 'INR',
      defaultUnitsPerDay: 0,
      name: 'Mess Tracker',
      unitLabel: 'thali',
      unitPrice: 100,
    })

    store.setDayLog(tabId, '2026-09-01', { totalUnits: 2 })
    store.setDayLog(tabId, '2026-09-02', { totalUnits: 1 })

    const summary = store.calculateMonthSummary(tabId, '2026-09')
    expect(summary.totalUnits).toBe(3)
    expect(summary.totalAmount).toBe(300)
    expect(summary.isSettled).toBe(false)

    store.settleMonth(tabId, '2026-09', 'wallet-boi')
    const settledSummary = store.calculateMonthSummary(tabId, '2026-09')
    expect(settledSummary.isSettled).toBe(true)
    expect(store.settlements[`${tabId}_2026-09`]).toBeDefined()
    expect(h.fromMock).toHaveBeenCalledWith('daily_tab_settlements')
  })
})
