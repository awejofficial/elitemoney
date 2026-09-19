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
  ogTitle: computed(() => `${person.value?.name || 'Contact'} — EliteMoney`),
})

// Modals state
const isAddEntryOpen = ref(false)
const isEditContactOpen = ref(false)
const isOptionsOpen = ref(false)
const isShowDeleteConfirm = ref(false)
const isShowSettleConfirm = ref(false)

const editName = ref('')
const editPhone = ref('')

const entryType = ref<LendingType>('lent')
const entryAmount = ref<number | undefined>(undefined)
const entryDesc = ref('')
const entryDueDate = ref('')

function openEditContact() {
  if (!person.value)
    return
  editName.value = person.value.name
  editPhone.value = person.value.phone || ''
  isOptionsOpen.value = false
  isEditContactOpen.value = true
}

function handleSaveContact() {
  if (!editName.value.trim() || !person.value)
    return
  peopleStore.updatePerson(personId.value, {
    name: editName.value.trim(),
    phone: editPhone.value.trim() || undefined,
  })
  isEditContactOpen.value = false
}

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

function handleDeletePersonConfirm() {
  peopleStore.deletePerson(personId.value)
  isShowDeleteConfirm.value = false
  router.replace('/people')
}

function handleSettleAllConfirm() {
  peopleStore.settleAllForPerson(personId.value)
  isShowSettleConfirm.value = false
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
      <NuxtLink to="/people" class="flex items-center">
        <UiActionButton :ariaLabel="$t('base.back')">
          <Icon name="lucide:chevron-left" size="24" />
        </UiActionButton>
      </NuxtLink>

      <UiHeaderTitle>
        {{ person.name }}
      </UiHeaderTitle>

      <template #actions>
        <BottomSheetOrDropdown
          :isOpen="isOptionsOpen"
          isShowCloseBtn
          @closeModal="isOptionsOpen = false"
          @openModal="isOptionsOpen = true"
        >
          <template #trigger>
            <UiActionButton :ariaLabel="$t('base.moreOptions')">
              <Icon name="lucide:ellipsis-vertical" size="20" />
            </UiActionButton>
          </template>

          <template #content>
            <div class="p-1 pt-3 pb-2 min-w-[200px]">
              <UiHeaderLink
                icon="lucide:pencil"
                @click="openEditContact"
              >
                {{ t('people.edit') }}
              </UiHeaderLink>

              <UiHeaderLink
                v-if="personBalance && personBalance.openEntriesCount > 0"
                icon="lucide:check-check"
                @click="isOptionsOpen = false; isShowSettleConfirm = true"
              >
                {{ t('people.settleAll') }}
              </UiHeaderLink>

              <UiHeaderLink
                icon="lucide:trash-2"
                class="text-error"
                @click="isOptionsOpen = false; isShowDeleteConfirm = true"
              >
                {{ t('base.delete') }}
              </UiHeaderLink>
            </div>
          </template>
        </BottomSheetOrDropdown>
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
              {{ t('people.netBalance') }}
            </div>
            <div v-if="personBalance" class="pt-1.5 flex justify-center">
              <Amount
                :amount="personBalance.netBalance"
                :currencyCode="currenciesStore.base"
                :colorize="personBalance.netBalance > 0 ? 'income' : personBalance.netBalance < 0 ? 'expense' : undefined"
                :isShowPlus="personBalance.netBalance > 0"
                :isShowMinus="personBalance.netBalance < 0"
                variant="xl"
                align="center"
              />
            </div>
            <div v-if="personBalance" class="text-xs pt-1">
              <span v-if="personBalance.netBalance > 0" class="text-income font-medium">
                {{ person.name }} {{ t('people.theyOweYou') }}
              </span>
              <span v-else-if="personBalance.netBalance < 0" class="text-expense font-medium">
                {{ t('people.youOweThem') }} {{ person.name }}
              </span>
              <span v-else class="text-muted">
                {{ t('people.settled') }}
              </span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center justify-center gap-2 pt-3">
            <UButton
              icon="lucide:arrow-up-right"
              size="sm"
              color="primary"
              variant="solid"
              @click="openAddEntry('lent')"
            >
              {{ t('people.lendMoney') }}
            </UButton>

            <UButton
              icon="lucide:arrow-down-left"
              size="sm"
              color="neutral"
              variant="outline"
              @click="openAddEntry('borrowed')"
            >
              {{ t('people.borrowMoney') }}
            </UButton>

            <UButton
              v-if="personBalance && personBalance.openEntriesCount > 0"
              icon="lucide:check-check"
              size="sm"
              color="success"
              variant="subtle"
              @click="isShowSettleConfirm = true"
            >
              {{ t('people.settleAll') }}
            </UButton>
          </div>
        </div>

        <!-- Entries Ledger Section -->
        <div>
          <div class="flex items-center justify-between pb-2 px-1">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ t('people.history') }}
            </h3>
            <span class="text-xs text-muted">
              {{ entries.length }}
            </span>
          </div>

          <div
            v-if="entries.length === 0"
            class="rounded-xl border border-dashed border-default p-6 text-center text-xs text-muted"
          >
            {{ t('people.desc') }}
          </div>

          <div v-else class="grid gap-1">
            <UiElement
              v-for="entry in entries"
              :key="entry.id"
              insideClasses="p-3 min-h-[48px] flex items-center justify-between"
              :class="{ 'opacity-60': entry.status === 'paid' }"
              class="group"
            >
              <!-- Left side: Type Icon & Description -->
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs"
                  :class="entry.type === 'lent' ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense'"
                >
                  <Icon :name="entry.type === 'lent' ? 'lucide:arrow-up-right' : 'lucide:arrow-down-left'" size="16" />
                </div>
                <div class="min-w-0 truncate">
                  <div class="font-medium text-highlighted text-xs flex items-center gap-1.5 truncate">
                    <span class="truncate">{{ entry.desc || (entry.type === 'lent' ? t('people.lendMoney') : t('people.borrowMoney')) }}</span>
                    <UBadge
                      v-if="entry.status === 'paid'"
                      size="xs"
                      color="neutral"
                      variant="subtle"
                    >
                      {{ t('people.settled') }}
                    </UBadge>
                  </div>
                  <div class="text-3xs text-dimmed flex items-center gap-2 pt-0.5">
                    <span>{{ formatDate(entry.date) }}</span>
                    <span v-if="entry.dueDate" class="text-amber-500">
                      Due: {{ formatDate(entry.dueDate) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right side: Amount & Quick Actions -->
              <div class="flex items-center gap-2 shrink-0">
                <Amount
                  :amount="entry.amount"
                  :currencyCode="entry.currency"
                  :colorize="entry.type === 'lent' ? 'income' : 'expense'"
                  :isShowPlus="entry.type === 'lent'"
                  :isShowMinus="entry.type === 'borrowed'"
                  variant="sm"
                  align="right"
                />

                <!-- Status toggle button -->
                <button
                  type="button"
                  :title="entry.status === 'open' ? t('people.markSettled') : t('people.markPending')"
                  class="interactive flex size-7 items-center justify-center rounded-md"
                  :class="entry.status === 'open' ? 'text-muted hover:text-highlighted' : 'text-income'"
                  @click="peopleStore.toggleEntryStatus(entry.id)"
                >
                  <Icon :name="entry.status === 'open' ? 'lucide:circle' : 'lucide:check-circle-2'" size="16" />
                </button>

                <!-- Delete record button -->
                <button
                  type="button"
                  :title="$t('base.delete')"
                  class="interactive flex size-7 items-center justify-center rounded-md text-muted hover:text-error"
                  @click="peopleStore.deleteEntry(entry.id)"
                >
                  <Icon name="lucide:trash-2" size="14" />
                </button>
              </div>
            </UiElement>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Contact Modal -->
    <UModal v-model:open="isEditContactOpen" :title="t('people.edit')">
      <template #body>
        <form class="grid gap-3.5 p-4" @submit.prevent="handleSaveContact">
          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('people.name') }} *
            </label>
            <UInput
              v-model="editName"
              placeholder="e.g. Alex Rivera"
              size="md"
              autofocus
              required
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('people.notes') }}
            </label>
            <UInput
              v-model="editPhone"
              placeholder="e.g. +1 555 0192"
              size="md"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" color="neutral" @click="isEditContactOpen = false">
              {{ t('base.cancel') }}
            </UButton>
            <UButton type="submit" color="primary" :disabled="!editName.trim()">
              {{ t('base.save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- Add Entry Modal -->
    <UModal
      v-model:open="isAddEntryOpen"
      :title="entryType === 'lent' ? t('people.lendMoney') : t('people.borrowMoney')"
    >
      <template #body>
        <form class="grid gap-3.5 p-4" @submit.prevent="handleAddEntry">
          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('base.amount') }} ({{ currenciesStore.base }}) *
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
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('base.description') }}
            </label>
            <UInput
              v-model="entryDesc"
              placeholder="e.g. Dinner, rent share, emergency cash"
              size="md"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              Expected Repayment Date (optional)
            </label>
            <UInput
              v-model="entryDueDate"
              type="date"
              size="md"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" color="neutral" @click="isAddEntryOpen = false">
              {{ t('base.cancel') }}
            </UButton>
            <UButton type="submit" color="primary" :disabled="!entryAmount || entryAmount <= 0">
              {{ t('base.save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- Confirm Delete Contact Modal -->
    <LayoutConfirmModal
      v-if="isShowDeleteConfirm"
      :title="t('people.deleteConfirm')"
      @closed="isShowDeleteConfirm = false"
      @confirm="handleDeletePersonConfirm"
    />

    <!-- Confirm Settle All Modal -->
    <LayoutConfirmModal
      v-if="isShowSettleConfirm"
      :title="t('people.settleAll')"
      description="Mark all outstanding records for this contact as settled?"
      @closed="isShowSettleConfirm = false"
      @confirm="handleSettleAllConfirm"
    />
  </UiPage>

  <div v-else class="flex h-64 items-center justify-center">
    <Icon name="lucide:loader-circle" class="size-6 animate-spin text-primary" />
  </div>
</template>
