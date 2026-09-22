import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePeopleStore } from './usePeopleStore'

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

describe('usePeopleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('generates valid UUIDs when adding a person', () => {
    const store = usePeopleStore()
    const id = store.addPerson('Shiva', '+91 9876543210')

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(store.people[id]).toBeDefined()
    expect(store.people[id]?.name).toBe('Shiva')
    expect(store.people[id]?.phone).toBe('+91 9876543210')
    expect(h.fromMock).toHaveBeenCalledWith('people')
  })

  it('adds lending entry and computes balance correctly', () => {
    const store = usePeopleStore()
    const personId = store.addPerson('Shiva')

    const entryId = store.addEntry({
      amount: 500,
      currency: 'INR',
      date: Date.now(),
      desc: 'For Laptop',
      personId,
      type: 'lent',
    })

    expect(entryId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(store.entries[entryId]?.amount).toBe(500)
    expect(store.balances[personId]?.totalLent).toBe(500)
    expect(store.balances[personId]?.netBalance).toBe(500)
    expect(store.totalOwedToYou).toBe(500)

    // Mark settled
    store.toggleEntryStatus(entryId)
    expect(store.entries[entryId]?.status).toBe('paid')
    expect(store.balances[personId]?.netBalance).toBe(0)
    expect(store.totalOwedToYou).toBe(0)
  })

  it('handles partial repayment and settlement', () => {
    const store = usePeopleStore()
    const personId = store.addPerson('Friend')

    const entryId = store.addEntry({
      amount: 1000,
      currency: 'INR',
      date: Date.now(),
      personId,
      type: 'lent',
    })

    store.addPartialPayment(entryId, 400)
    expect(store.entries[entryId]?.paidAmount).toBe(400)
    expect(store.entries[entryId]?.status).toBe('open')
    expect(store.balances[personId]?.netBalance).toBe(600)

    store.addPartialPayment(entryId, 600)
    expect(store.entries[entryId]?.paidAmount).toBe(1000)
    expect(store.entries[entryId]?.status).toBe('paid')
    expect(store.balances[personId]?.netBalance).toBe(0)
  })
})
