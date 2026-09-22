import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSupabase, useSupabaseAuth } from '~/composables/useSupabase'
import { createLogger } from '~/utils/logger'

const logger = createLogger('people-store')

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

function encodePersonName(name: string, phone?: string): string {
  const trimmedName = name.trim()
  const trimmedPhone = phone?.trim()
  if (trimmedPhone)
    return `${trimmedName}:::phone:::${trimmedPhone}`
  return trimmedName
}

function decodePersonName(rawName: string): { name: string, phone?: string } {
  if (!rawName)
    return { name: '' }
  if (rawName.includes(':::phone:::')) {
    const parts = rawName.split(':::phone:::')
    return {
      name: parts[0]?.trim() || '',
      phone: parts[1]?.trim() || undefined,
    }
  }
  return { name: rawName.trim() }
}

function encodeEntryNote(entry: {
  desc?: string
  paidAmount?: number
  status?: LendingStatus
  currency?: string
  walletId?: string
}): string {
  return JSON.stringify({
    currency: entry.currency || 'USD',
    desc: entry.desc || '',
    paidAmount: entry.paidAmount || 0,
    status: entry.status || 'open',
    walletId: entry.walletId || undefined,
  })
}

function decodeEntryNote(note: string | null): {
  desc?: string
  paidAmount: number
  status: LendingStatus
  currency?: string
  walletId?: string
} {
  if (!note)
    return { paidAmount: 0, status: 'open' }
  try {
    const parsed = JSON.parse(note)
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        currency: parsed.currency || undefined,
        desc: parsed.desc || undefined,
        paidAmount: Number(parsed.paidAmount) || 0,
        status: parsed.status === 'paid' ? 'paid' : 'open',
        walletId: parsed.walletId || undefined,
      }
    }
  }
  catch {
    // If it's plain text (e.g. from an earlier version or direct input)
    return {
      desc: note,
      paidAmount: 0,
      status: 'open',
    }
  }
  return { paidAmount: 0, status: 'open' }
}

function toDateString(timestamp: number): string {
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime()))
    return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function fromDateString(dateStr: string | null | undefined): number {
  if (!dateStr)
    return Date.now()
  const parsed = new Date(dateStr).getTime()
  return Number.isNaN(parsed) ? Date.now() : parsed
}

export const usePeopleStore = defineStore('people', () => {
  const people = useStorage<Record<string, PersonItem>>('elitemoney.people', {})
  const entries = useStorage<Record<string, LendingEntry>>('elitemoney.lendingEntries', {})

  // Map of old legacy local IDs (e.g. p_12345) to new UUIDs
  const legacyIdMap = ref<Record<string, string>>({})
  const isSyncing = ref(false)
  const isLoaded = ref(false)

  const supabase = useSupabase()
  const { uid } = useSupabaseAuth()

  let realtimeChannel: any = null

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
        netBalance: 0,
        openEntriesCount: 0,
        person: p,
        totalBorrowed: 0,
        totalLent: 0,
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

  function getRemainingBalance(entry: LendingEntry): number {
    return Math.max(0, entry.amount - (entry.paidAmount || 0))
  }

  function getEntriesForPerson(personId: string): LendingEntry[] {
    const resolvedId = legacyIdMap.value[personId] || personId
    return entriesList.value.filter(e => e.personId === resolvedId || e.personId === personId)
  }

  function findPerson(id: string): PersonItem | undefined {
    const mappedId = legacyIdMap.value[id]
    return people.value[id] || (mappedId ? people.value[mappedId] : undefined)
  }

  /**
   * Migrate any existing local items that have legacy non-UUID IDs (e.g. p_123...)
   * or are not yet in Supabase.
   */
  async function migrateLocalItemsToSupabase(currentUid: string) {
    const localPeople = { ...people.value }
    const localEntries = { ...entries.value }

    const personIdRemap: Record<string, string> = {}
    let hasChanges = false

    // 1. Remap non-UUID person IDs
    for (const [id, p] of Object.entries(localPeople)) {
      if (!isUuid(id)) {
        const newId = generateId()
        personIdRemap[id] = newId
        legacyIdMap.value[id] = newId
        localPeople[newId] = { ...p, id: newId }
        delete localPeople[id]
        hasChanges = true
        logger.log(`Migrated person ID from ${id} to ${newId}`)
      }
    }

    // 2. Remap entries pointing to old person IDs or with non-UUID entry IDs
    for (const [id, e] of Object.entries(localEntries)) {
      const updatedPersonId = personIdRemap[e.personId] || e.personId
      let updatedEntryId = id
      let entryChanged = false

      if (!isUuid(id)) {
        updatedEntryId = generateId()
        legacyIdMap.value[id] = updatedEntryId
        delete localEntries[id]
        entryChanged = true
        hasChanges = true
      }

      if (entryChanged || updatedPersonId !== e.personId) {
        localEntries[updatedEntryId] = {
          ...e,
          id: updatedEntryId,
          personId: updatedPersonId,
        }
        hasChanges = true
      }
    }

    if (hasChanges) {
      people.value = localPeople
      entries.value = localEntries
    }

    // 3. Upload local people to Supabase if not yet present
    for (const p of Object.values(localPeople)) {
      try {
        await supabase.from('people').upsert({
          created_at: new Date(p.createdAt).toISOString(),
          id: p.id,
          name: encodePersonName(p.name, p.phone),
          user_id: currentUid,
        })
      }
      catch (err) {
        logger.error('Failed to sync migrated person', p.name, err)
      }
    }

    // 4. Upload local entries to Supabase if not yet present
    for (const e of Object.values(localEntries)) {
      try {
        await supabase.from('lending_entries').upsert({
          amount: e.amount,
          created_at: new Date(e.date).toISOString(),
          date: toDateString(e.date),
          direction: e.type,
          due_date: e.dueDate ? toDateString(e.dueDate) : null,
          id: e.id,
          note: encodeEntryNote(e),
          person_id: e.personId,
          user_id: currentUid,
        })
      }
      catch (err) {
        logger.error('Failed to sync migrated entry', e.desc, err)
      }
    }
  }

  /**
   * Fetch all people and lending entries from Supabase for the current user.
   */
  async function fetchFromSupabase() {
    const currentUid = uid.value
    if (!currentUid)
      return

    isSyncing.value = true
    try {
      const [peopleRes, entriesRes] = await Promise.all([
        supabase.from('people').select('*').order('created_at', { ascending: true }),
        supabase.from('lending_entries').select('*').order('date', { ascending: false }),
      ])

      if (peopleRes.error) {
        logger.error('Error fetching people from Supabase', peopleRes.error)
      }
      else if (peopleRes.data) {
        const nextPeople: Record<string, PersonItem> = {}
        for (const row of peopleRes.data) {
          const { name, phone } = decodePersonName(row.name)
          nextPeople[row.id] = {
            createdAt: fromDateString(row.created_at),
            id: row.id,
            name,
            phone,
          }
        }

        // If local had people not in Supabase yet, keep and migrate them
        if (peopleRes.data.length === 0 && Object.keys(people.value).length > 0) {
          await migrateLocalItemsToSupabase(currentUid)
        }
        else {
          // Merge: remote takes precedence, local legacy items get migrated
          people.value = { ...people.value, ...nextPeople }
        }
      }

      if (entriesRes.error) {
        logger.error('Error fetching lending entries from Supabase', entriesRes.error)
      }
      else if (entriesRes.data) {
        const nextEntries: Record<string, LendingEntry> = {}
        for (const row of entriesRes.data) {
          const decoded = decodeEntryNote(row.note)
          nextEntries[row.id] = {
            amount: Number(row.amount) || 0,
            currency: decoded.currency || 'USD',
            date: fromDateString(row.date),
            desc: decoded.desc,
            dueDate: row.due_date ? fromDateString(row.due_date) : undefined,
            id: row.id,
            paidAmount: decoded.paidAmount,
            personId: row.person_id,
            status: decoded.status,
            type: (row.direction === 'borrowed' ? 'borrowed' : 'lent') as LendingType,
            walletId: decoded.walletId,
          }
        }

        if (entriesRes.data.length === 0 && Object.keys(entries.value).length > 0) {
          await migrateLocalItemsToSupabase(currentUid)
        }
        else {
          entries.value = { ...entries.value, ...nextEntries }
        }
      }

      isLoaded.value = true
    }
    catch (err) {
      logger.error('Unexpected error fetching from Supabase', err)
    }
    finally {
      isSyncing.value = false
    }
  }

  /**
   * Set up real-time subscription via Supabase Realtime channel.
   */
  function setupRealtime() {
    if (realtimeChannel) {
      realtimeChannel.unsubscribe()
      realtimeChannel = null
    }

    const currentUid = uid.value
    if (!currentUid)
      return

    realtimeChannel = supabase
      .channel('realtime:people_and_lending')
      .on(
        'postgres_changes',
        { event: '*', filter: `user_id=eq.${currentUid}`, schema: 'public', table: 'people' },
        (payload) => {
          logger.log('Realtime people change received', payload.eventType)
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            delete people.value[payload.old.id]
          }
          else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const { name, phone } = decodePersonName(payload.new.name)
            people.value[payload.new.id] = {
              createdAt: fromDateString(payload.new.created_at),
              id: payload.new.id,
              name,
              phone,
            }
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', filter: `user_id=eq.${currentUid}`, schema: 'public', table: 'lending_entries' },
        (payload) => {
          logger.log('Realtime lending_entries change received', payload.eventType)
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            delete entries.value[payload.old.id]
          }
          else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const row = payload.new
            const decoded = decodeEntryNote(row.note)
            entries.value[row.id] = {
              amount: Number(row.amount) || 0,
              currency: decoded.currency || 'USD',
              date: fromDateString(row.date),
              desc: decoded.desc,
              dueDate: row.due_date ? fromDateString(row.due_date) : undefined,
              id: row.id,
              paidAmount: decoded.paidAmount,
              personId: row.person_id,
              status: decoded.status,
              type: (row.direction === 'borrowed' ? 'borrowed' : 'lent') as LendingType,
              walletId: decoded.walletId,
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

  // Automatically initialize when user logs in or auth state changes
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

    // Auto-refresh when user switches back to this browser tab
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && uid.value) {
        fetchFromSupabase()
      }
    })
  }

  function addPerson(name: string, phone?: string): string {
    const id = generateId()
    const item: PersonItem = {
      createdAt: Date.now(),
      id,
      name: name.trim(),
      phone: phone?.trim(),
    }
    people.value[id] = item

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('people').insert({
        created_at: new Date(item.createdAt).toISOString(),
        id,
        name: encodePersonName(item.name, item.phone),
        user_id: currentUid,
      }).then(({ error }) => {
        if (error)
          logger.error('Failed to insert person to Supabase', error)
      })
    }

    return id
  }

  function updatePerson(id: string, data: Partial<Omit<PersonItem, 'id'>>) {
    const resolvedId = legacyIdMap.value[id] || id
    if (!people.value[resolvedId])
      return

    people.value[resolvedId] = { ...people.value[resolvedId], ...data }
    const updated = people.value[resolvedId]

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('people').update({
        name: encodePersonName(updated.name, updated.phone),
      }).eq('id', resolvedId).then(({ error }) => {
        if (error)
          logger.error('Failed to update person in Supabase', error)
      })
    }
  }

  function deletePerson(id: string) {
    const resolvedId = legacyIdMap.value[id] || id
    delete people.value[resolvedId]
    for (const [entryId, entry] of Object.entries(entries.value)) {
      if (entry.personId === resolvedId || entry.personId === id)
        delete entries.value[entryId]
    }

    const currentUid = uid.value
    if (currentUid) {
      void (async () => {
        try {
          await supabase.from('lending_entries').delete().eq('person_id', resolvedId)
          await supabase.from('people').delete().eq('id', resolvedId)
        }
        catch (err) {
          logger.error('Failed to delete person in Supabase', err)
        }
      })()
    }
  }

  function addEntry(data: Omit<LendingEntry, 'id' | 'status' | 'paidAmount'> & { status?: LendingStatus, paidAmount?: number }): string {
    const id = generateId()
    const resolvedPersonId = legacyIdMap.value[data.personId] || data.personId

    const item: LendingEntry = {
      ...data,
      id,
      paidAmount: data.paidAmount ?? 0,
      personId: resolvedPersonId,
      status: data.status ?? 'open',
    }
    entries.value[id] = item

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('lending_entries').insert({
        amount: item.amount,
        created_at: new Date(item.date).toISOString(),
        date: toDateString(item.date),
        direction: item.type,
        due_date: item.dueDate ? toDateString(item.dueDate) : null,
        id,
        note: encodeEntryNote(item),
        person_id: resolvedPersonId,
        user_id: currentUid,
      }).then(({ error }) => {
        if (error)
          logger.error('Failed to insert lending entry in Supabase', error)
      })
    }

    return id
  }

  function toggleEntryStatus(id: string) {
    const resolvedId = legacyIdMap.value[id] || id
    const entry = entries.value[resolvedId]
    if (!entry)
      return

    entry.status = entry.status === 'open' ? 'paid' : 'open'
    updateEntry(resolvedId, { status: entry.status })
  }

  function updateEntry(id: string, data: Partial<Omit<LendingEntry, 'id'>>) {
    const resolvedId = legacyIdMap.value[id] || id
    if (!entries.value[resolvedId])
      return

    entries.value[resolvedId] = { ...entries.value[resolvedId], ...data }
    const updated = entries.value[resolvedId]

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('lending_entries').update({
        amount: updated.amount,
        date: toDateString(updated.date),
        direction: updated.type,
        due_date: updated.dueDate ? toDateString(updated.dueDate) : null,
        note: encodeEntryNote(updated),
      }).eq('id', resolvedId).then(({ error }) => {
        if (error)
          logger.error('Failed to update lending entry in Supabase', error)
      })
    }
  }

  function deleteEntry(id: string) {
    const resolvedId = legacyIdMap.value[id] || id
    delete entries.value[resolvedId]

    const currentUid = uid.value
    if (currentUid) {
      supabase.from('lending_entries').delete().eq('id', resolvedId).then(({ error }) => {
        if (error)
          logger.error('Failed to delete lending entry in Supabase', error)
      })
    }
  }

  function addPartialPayment(entryId: string, paymentAmount: number) {
    const resolvedId = legacyIdMap.value[entryId] || entryId
    const entry = entries.value[resolvedId]
    if (!entry || paymentAmount <= 0)
      return

    const currentPaid = entry.paidAmount || 0
    const newPaid = currentPaid + paymentAmount
    entry.paidAmount = newPaid

    // Auto-settle if fully repaid
    if (newPaid >= entry.amount)
      entry.status = 'paid'

    updateEntry(resolvedId, {
      paidAmount: entry.paidAmount,
      status: entry.status,
    })
  }

  function settleAllForPerson(personId: string) {
    const resolvedId = legacyIdMap.value[personId] || personId
    for (const entry of Object.values(entries.value)) {
      if (entry.personId === resolvedId || entry.personId === personId) {
        entry.status = 'paid'
        updateEntry(entry.id, { status: 'paid' })
      }
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
      amount: 150,
      currency,
      date: now - dayMs * 3,
      desc: 'Dinner & concert tickets',
      dueDate: now + dayMs * 7,
      personId: alexId,
      type: 'lent',
    })

    addEntry({
      amount: 75,
      currency,
      date: now - dayMs * 5,
      desc: 'Shared Airbnb deposit',
      dueDate: now + dayMs * 2,
      personId: priyaId,
      type: 'borrowed',
    })

    addEntry({
      amount: 40,
      currency,
      date: now - dayMs * 10,
      desc: 'Lunch at cafe',
      personId: davidId,
      status: 'paid',
      type: 'lent',
    })
  }

  return {
    addEntry,
    addPartialPayment,
    addPerson,
    balances,
    deleteEntry,
    deletePerson,
    entries,
    entriesList,
    fetchFromSupabase,
    findPerson,
    getEntriesForPerson,
    getRemainingBalance,
    init,
    isLoaded,
    isSyncing,
    legacyIdMap,
    people,
    peopleList,
    seedSamplePeople,
    settleAllForPerson,
    toggleEntryStatus,
    totalOwedToYou,
    totalYouOwe,
    updateEntry,
    updatePerson,
  }
})
