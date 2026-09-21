import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export type LendingType = 'lent' | 'borrowed'
export type LendingStatus = 'open' | 'paid'

export interface PersonItem {
  id: string
  name: string
  phone?: string
  createdAt: number
}

export interface LendingEntry {
  id: string
  personId: string
  type: LendingType
  amount: number
  paidAmount: number // cumulative amount repaid so far
  currency: string
  date: number
  dueDate?: number
  status: LendingStatus
  desc?: string
  walletId?: string
}

export interface PersonBalanceInfo {
  person: PersonItem
  totalLent: number
  totalBorrowed: number
  netBalance: number
  openEntriesCount: number
}

export const usePeopleStore = defineStore('people', () => {
  const people = useStorage<Record<string, PersonItem>>('elitemoney.people', {})
  const entries = useStorage<Record<string, LendingEntry>>('elitemoney.lendingEntries', {})

  const peopleList = computed<PersonItem[]>(() =>
    Object.values(people.value).sort((a, b) => a.name.localeCompare(b.name)),
  )

  const entriesList = computed<LendingEntry[]>(() =>
    Object.values(entries.value).sort((a, b) => b.date - a.date),
  )

  const balances = computed<Record<string, PersonBalanceInfo>>(() => {
    const map: Record<string, PersonBalanceInfo> = {}

    for (const p of peopleList.value) {
      map[p.id] = {
        person: p,
        totalLent: 0,
        totalBorrowed: 0,
        netBalance: 0,
        openEntriesCount: 0,
      }
    }

    for (const e of entriesList.value) {
      const b = map[e.personId]
      if (!b)
        continue

      if (e.status === 'open') {
        const remaining = getRemainingBalance(e)
        b.openEntriesCount++
        if (e.type === 'lent') {
          b.totalLent += remaining
          b.netBalance += remaining
        }
        else {
          b.totalBorrowed += remaining
          b.netBalance -= remaining
        }
      }
    }

    return map
  })

  const totalOwedToYou = computed(() => {
    return Object.values(balances.value).reduce((acc, b) => {
      return b.netBalance > 0 ? acc + b.netBalance : acc
    }, 0)
  })

  const totalYouOwe = computed(() => {
    return Object.values(balances.value).reduce((acc, b) => {
      return b.netBalance < 0 ? acc + Math.abs(b.netBalance) : acc
    }, 0)
  })

  function addPerson(name: string, phone?: string): string {
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    people.value[id] = {
      id,
      name: name.trim(),
      phone: phone?.trim(),
      createdAt: Date.now(),
    }
    return id
  }

  function updatePerson(id: string, data: Partial<Omit<PersonItem, 'id'>>) {
    if (!people.value[id])
      return
    people.value[id] = { ...people.value[id], ...data }
  }

  function deletePerson(id: string) {
    delete people.value[id]
    for (const [entryId, entry] of Object.entries(entries.value)) {
      if (entry.personId === id)
        delete entries.value[entryId]
    }
  }

  function getRemainingBalance(entry: LendingEntry): number {
    return Math.max(0, entry.amount - (entry.paidAmount || 0))
  }

  function addEntry(data: Omit<LendingEntry, 'id' | 'status' | 'paidAmount'> & { status?: LendingStatus, paidAmount?: number }): string {
    const id = `le_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    entries.value[id] = {
      id,
      ...data,
      paidAmount: data.paidAmount ?? 0,
      status: data.status ?? 'open',
    }
    return id
  }

  function toggleEntryStatus(id: string) {
    if (!entries.value[id])
      return
    entries.value[id].status = entries.value[id].status === 'open' ? 'paid' : 'open'
  }

  function updateEntry(id: string, data: Partial<Omit<LendingEntry, 'id'>>) {
    if (!entries.value[id])
      return
    entries.value[id] = { ...entries.value[id], ...data }
  }

  function deleteEntry(id: string) {
    delete entries.value[id]
  }

  function addPartialPayment(entryId: string, paymentAmount: number) {
    const entry = entries.value[entryId]
    if (!entry || paymentAmount <= 0)
      return

    const currentPaid = entry.paidAmount || 0
    const newPaid = currentPaid + paymentAmount
    entry.paidAmount = newPaid

    // Auto-settle if fully repaid
    if (newPaid >= entry.amount)
      entry.status = 'paid'
  }

  function getEntriesForPerson(personId: string): LendingEntry[] {
    return entriesList.value.filter(e => e.personId === personId)
  }

  function settleAllForPerson(personId: string) {
    for (const entry of Object.values(entries.value)) {
      if (entry.personId === personId)
        entry.status = 'paid'
    }
  }

  function seedSamplePeople(currency: string = 'USD') {
    if (Object.keys(people.value).length > 0)
      return

    const alexId = addPerson('Alex Rivera', '+1 555 0192')
    const priyaId = addPerson('Priya Sharma', '+1 555 0834')
    const davidId = addPerson('David Chen', '+1 555 0471')

    const now = Date.now()
    const dayMs = 86400000

    addEntry({
      personId: alexId,
      type: 'lent',
      amount: 150,
      currency,
      date: now - dayMs * 3,
      dueDate: now + dayMs * 7,
      desc: 'Dinner & concert tickets',
    })

    addEntry({
      personId: priyaId,
      type: 'borrowed',
      amount: 75,
      currency,
      date: now - dayMs * 5,
      dueDate: now + dayMs * 2,
      desc: 'Shared Airbnb deposit',
    })

    addEntry({
      personId: davidId,
      type: 'lent',
      amount: 40,
      currency,
      date: now - dayMs * 10,
      status: 'paid',
      desc: 'Lunch at cafe',
    })
  }

  return {
    people,
    entries,
    peopleList,
    entriesList,
    balances,
    totalOwedToYou,
    totalYouOwe,
    addPerson,
    updatePerson,
    deletePerson,
    addEntry,
    updateEntry,
    toggleEntryStatus,
    deleteEntry,
    addPartialPayment,
    getRemainingBalance,
    getEntriesForPerson,
    settleAllForPerson,
    seedSamplePeople,
  }
})
