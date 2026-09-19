<script setup lang="ts">
import { usePeopleStore, type LendingType } from '~/components/people/usePeopleStore'
import { useCurrenciesStore } from '~/components/currencies/useCurrenciesStore'

defineOptions({ name: 'PersonDetailPage' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const peopleStore = usePeopleStore()
const currenciesStore = useCurrenciesStore()

const personId = computed(() => route.params.id as string)
const person = computed(() => peopleStore.people[personId.value])
const personBalance = computed(() => peopleStore.balances[personId.value])
const entries = computed(() => peopleStore.getEntriesForPerson(personId.value))

useSeoMeta({
  title: computed(() => `${person.value?.name || 'Contact'} — EliteMoney`),
})

const isAddEntryOpen = ref(false)
const entryType = ref<LendingType>('lent')
const entryAmount = ref<number | undefined>(undefined)
const entryDesc = ref('')
const entryDueDate = ref('')

function openAddEntry(type: LendingType) {
  entryType.value = type
  entryAmount.value = undefined
  entryDesc.value = ''
  entryDueDate.value = ''
  isAddEntryOpen.value = true
}

function handleAddEntry() {
  if (!entryAmount.value || entryAmount.value <= 0)
    return

  peopleStore.addEntry({
    personId: personId.value,
    type: entryType.value,
    amount: Number(entryAmount.value),
    currency: currenciesStore.base,
    date: Date.now(),
    dueDate: entryDueDate.value ? new Date(entryDueDate.value).getTime() : undefined,
    desc: entryDesc.value.trim() || undefined,
  })

  isAddEntryOpen.value = false
}

function handleDeletePerson() {
  if (!confirm(`Delete ${person.value?.name} and all associated entries?`))
    return
  peopleStore.deletePerson(personId.value)
  router.replace('/people')
}

function handleSettleAll() {
  if (!confirm(`Mark all outstanding entries for ${person.value?.name} as paid/settled?`))
    return
  peopleStore.settleAllForPerson(personId.value)
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <UiPage v-if="person">
    <UiHeader>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-arrow-left"
          size="sm"
          color="neutral"
          variant="ghost"
          to="/people"
        />
        <UiHeaderTitle>
          {{ person.name }}
        </UiHeaderTitle>
      </div>
      <template #actions>
        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="error"
          variant="ghost"
          @click="handleDeletePerson"
        />
      </template>
    </UiHeader>

    <div class="pageWrapper">
      <div class="grid gap-4 px-2 pt-2 pb-16 @3xl/main:max-w-2xl">
        <!-- Balance Hero Card -->
        <div class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-default bg-elevated/40 p-6 text-center backdrop-blur">
          <div class="flex size-14 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-xl uppercase">
            {{ person.name.charAt(0) }}
          </div>

          <div>
            <div class="text-xs font-medium text-muted">
              {{ t('people.currentNetBalance', 'Net Balance') }}
            </div>
            <div
              v-if="personBalance"
              class="pt-1 text-3xl font-extrabold font-brand tracking-tight"
              :class="personBalance.netBalance > 0 ? 'text-emerald-500' : personBalance.netBalance < 0 ? 'text-rose-500' : 'text-highlighted'"
            >
              <span v-if="personBalance.netBalance > 0">+</span>
              {{ personBalance.netBalance }} {{ currenciesStore.base }}
            </div>
            <div v-if="personBalance" class="text-xs pt-0.5">
              <span v-if="personBalance.netBalance > 0" class="text-emerald-500 font-medium">
                {{ person.name }} {{ t('people.owesYouFull', 'owes you this amount') }}
              </span>
              <span v-else-if="personBalance.netBalance < 0" class="text-rose-500 font-medium">
                {{ t('people.youOweFull', 'You owe') }} {{ person.name }} {{ t('people.thisAmount', 'this amount') }}
              </span>
              <span v-else class="text-muted">
                {{ t('people.allSettled', 'Everything is settled up!') }}
              </span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center justify-center gap-2 pt-3">
            <UButton
              icon="i-lucide-arrow-up-right"
              size="sm"
              color="primary"
              variant="solid"
              @click="openAddEntry('lent')"
            >
              {{ t('people.lentMoney', 'Lend Money') }}
            </UButton>

            <UButton
              icon="i-lucide-arrow-down-left"
              size="sm"
              color="neutral"
              variant="outline"
              @click="openAddEntry('borrowed')"
            >
              {{ t('people.borrowedMoney', 'Borrow Money') }}
            </UButton>

            <UButton
              v-if="personBalance && personBalance.openEntriesCount > 0"
              icon="i-lucide-check-check"
              size="sm"
              color="success"
              variant="subtle"
              @click="handleSettleAll"
            >
              {{ t('people.settleAll', 'Settle All') }}
            </UButton>
          </div>
        </div>

        <!-- Entries Ledger Section -->
        <div>
          <div class="flex items-center justify-between pb-2 px-1">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ t('people.history', 'Lending History') }}
            </h3>
            <span class="text-xs text-muted">
              {{ entries.length }} {{ t('people.records', 'records') }}
            </span>
          </div>

          <div
            v-if="entries.length === 0"
            class="rounded-xl border border-dashed border-default p-6 text-center text-xs text-muted"
          >
            {{ t('people.noEntries', 'No loans or repayments recorded yet.') }}
          </div>

          <div v-else class="flex flex-col divide-y divide-default overflow-hidden rounded-2xl border border-default bg-elevated/30">
            <div
              v-for="entry in entries"
              :key="entry.id"
              class="flex items-center justify-between p-3 transition-colors hover:bg-elevated/50"
              :class="{ 'opacity-60': entry.status === 'paid' }"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex size-8 items-center justify-center rounded-lg text-xs"
                  :class="entry.type === 'lent' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'"
                >
                  <UIcon :name="entry.type === 'lent' ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-left'" class="size-4" />
                </div>
                <div>
                  <div class="font-medium text-highlighted text-xs flex items-center gap-1.5">
                    <span>{{ entry.desc || (entry.type === 'lent' ? t('people.lentLabel', 'Lent') : t('people.borrowedLabel', 'Borrowed')) }}</span>
                    <UBadge
                      v-if="entry.status === 'paid'"
                      size="xs"
                      color="neutral"
                      variant="subtle"
                    >
                      {{ t('people.paid', 'Paid') }}
                    </UBadge>
                  </div>
                  <div class="text-3xs text-dimmed flex items-center gap-2 pt-0.5">
                    <span>{{ formatDate(entry.date) }}</span>
                    <span v-if="entry.dueDate" class="text-amber-500">
                      {{ t('people.due', 'Due') }}: {{ formatDate(entry.dueDate) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Amount & Status Toggle -->
              <div class="flex items-center gap-2">
                <div
                  class="text-xs font-semibold text-right"
                  :class="entry.type === 'lent' ? 'text-emerald-500' : 'text-rose-500'"
                >
                  <span v-if="entry.type === 'lent'">+</span>
                  <span v-else>-</span>
                  {{ entry.amount }} {{ entry.currency }}
                </div>
                <UButton
                  :icon="entry.status === 'open' ? 'i-lucide-circle' : 'i-lucide-check-circle-2'"
                  size="xs"
                  :color="entry.status === 'open' ? 'neutral' : 'success'"
                  variant="ghost"
                  :title="entry.status === 'open' ? 'Mark as Paid' : 'Mark as Open'"
                  @click="peopleStore.toggleEntryStatus(entry.id)"
                />
                <UButton
                  icon="i-lucide-x"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="peopleStore.deleteEntry(entry.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Entry Modal -->
    <UModal v-model:open="isAddEntryOpen" :title="entryType === 'lent' ? t('people.recordLent', 'Record Lent Money') : t('people.recordBorrowed', 'Record Borrowed Money')">
      <template #body>
        <form class="grid gap-3 p-4" @submit.prevent="handleAddEntry">
          <div>
            <label class="block text-xs font-medium text-muted pb-1">
              {{ t('base.amount', 'Amount') }} ({{ currenciesStore.base }}) *
            </label>
            <UInput
              v-model="entryAmount"
              type="number"
              step="any"
              placeholder="0.00"
              size="lg"
              autofocus
              required
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1">
              {{ t('base.description', 'Description or Note') }}
            </label>
            <UInput
              v-model="entryDesc"
              placeholder="e.g. Dinner, rent share, emergency cash"
              size="md"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1">
              {{ t('people.dueDateLabel', 'Expected Repayment Date (optional)') }}
            </label>
            <UInput
              v-model="entryDueDate"
              type="date"
              size="md"
            />
          </div>

          <div class="flex justify-end gap-2 pt-3">
            <UButton variant="ghost" color="neutral" @click="isAddEntryOpen = false">
              {{ t('base.cancel', 'Cancel') }}
            </UButton>
            <UButton type="submit" color="primary" :disabled="!entryAmount || entryAmount <= 0">
              {{ t('base.save', 'Save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </UiPage>

  <div v-else class="flex h-64 items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-primary" />
  </div>
</template>
