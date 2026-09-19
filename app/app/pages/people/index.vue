<script setup lang="ts">
import { usePeopleStore, type PersonItem } from '~/components/people/usePeopleStore'
import { useCurrenciesStore } from '~/components/currencies/useCurrenciesStore'

defineOptions({ name: 'PeoplePage' })

const { t } = useI18n()
const peopleStore = usePeopleStore()
const currenciesStore = useCurrenciesStore()

useSeoMeta({
  title: computed(() => `${t('people.title')} — EliteMoney`),
  ogTitle: computed(() => `${t('people.title')} — EliteMoney`),
})

const isModalOpen = ref(false)
const editingPersonId = ref<string | null>(null)
const personName = ref('')
const personPhone = ref('')
const searchQuery = ref('')

const filteredPeople = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q)
    return peopleStore.peopleList
  return peopleStore.peopleList.filter(p =>
    p.name.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q),
  )
})

function openAddPerson() {
  editingPersonId.value = null
  personName.value = ''
  personPhone.value = ''
  isModalOpen.value = true
}

function openEditPerson(person: PersonItem, e?: Event) {
  e?.stopPropagation()
  e?.preventDefault()
  editingPersonId.value = person.id
  personName.value = person.name
  personPhone.value = person.phone || ''
  isModalOpen.value = true
}

function handleSavePerson() {
  if (!personName.value.trim())
    return

  if (editingPersonId.value) {
    peopleStore.updatePerson(editingPersonId.value, {
      name: personName.value.trim(),
      phone: personPhone.value.trim() || undefined,
    })
    isModalOpen.value = false
  }
  else {
    const id = peopleStore.addPerson(personName.value, personPhone.value)
    personName.value = ''
    personPhone.value = ''
    isModalOpen.value = false
    navigateTo(`/people/${id}`)
  }
}
</script>

<template>
  <UiPage>
    <UiHeader>
      <UiHeaderTitle>
        {{ t('people.title') }}
      </UiHeaderTitle>
      <template #actions>
        <UiActionButton
          :ariaLabel="t('people.new')"
          @click="openAddPerson"
        >
          <Icon name="lucide:plus" size="24" />
        </UiActionButton>
      </template>
    </UiHeader>

    <div class="pageWrapper">
      <div class="grid gap-4 px-2 pt-2 pb-16 @3xl/main:max-w-2xl">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-default bg-elevated/40 p-3.5 backdrop-blur flex flex-col justify-between">
            <div class="text-xs font-medium text-muted">
              {{ t('people.totalLent') }}
            </div>
            <div class="pt-1.5">
              <Amount
                :amount="peopleStore.totalOwedToYou"
                :currencyCode="currenciesStore.base"
                colorize="income"
                isShowPlus
                variant="xl"
              />
            </div>
          </div>

          <div class="rounded-xl border border-default bg-elevated/40 p-3.5 backdrop-blur flex flex-col justify-between">
            <div class="text-xs font-medium text-muted">
              {{ t('people.totalBorrowed') }}
            </div>
            <div class="pt-1.5">
              <Amount
                :amount="peopleStore.totalYouOwe"
                :currencyCode="currenciesStore.base"
                colorize="expense"
                isShowMinus
                variant="xl"
              />
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div v-if="peopleStore.peopleList.length > 0">
          <UInput
            v-model="searchQuery"
            icon="lucide:search"
            :placeholder="t('people.search')"
            size="md"
            class="w-full"
          />
        </div>

        <!-- Empty State -->
        <div
          v-if="peopleStore.peopleList.length === 0"
          class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-default p-8 text-center"
        >
          <div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="lucide:users" size="28" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-highlighted">
              {{ t('people.noPeople') }}
            </h3>
            <p class="text-xs text-muted pt-1 max-w-xs">
              {{ t('people.addFirst') }}
            </p>
          </div>
          <UButton
            icon="lucide:plus"
            size="md"
            color="primary"
            class="mt-2"
            @click="openAddPerson"
          >
            {{ t('people.new') }}
          </UButton>
        </div>

        <!-- People List -->
        <div v-else class="grid gap-1">
          <UiElement
            v-for="person in filteredPeople"
            :key="person.id"
            :to="`/people/${person.id}`"
            insideClasses="py-3 px-3.5 min-h-[54px] flex items-center justify-between"
            class="group"
          >
            <!-- Left Side: Avatar & Name -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-sm uppercase">
                {{ person.name.charAt(0) }}
              </div>
              <div class="min-w-0 truncate">
                <div class="font-medium text-highlighted text-sm truncate">
                  {{ person.name }}
                </div>
                <div v-if="person.phone" class="text-2xs text-muted truncate">
                  {{ person.phone }}
                </div>
              </div>
            </div>

            <!-- Right Side: Amount, Edit Button, and Chevron -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="text-right">
                <template v-if="peopleStore.balances[person.id]">
                  <Amount
                    v-if="peopleStore.balances[person.id]!.netBalance !== 0"
                    :amount="peopleStore.balances[person.id]!.netBalance"
                    :currencyCode="currenciesStore.base"
                    :colorize="peopleStore.balances[person.id]!.netBalance > 0 ? 'income' : 'expense'"
                    :isShowPlus="peopleStore.balances[person.id]!.netBalance > 0"
                    :isShowMinus="peopleStore.balances[person.id]!.netBalance < 0"
                    variant="sm"
                    align="right"
                  />
                  <div v-else class="text-xs text-muted">
                    {{ t('people.settled') }}
                  </div>
                </template>
              </div>

              <!-- Quick Edit Icon Button -->
              <button
                type="button"
                :title="t('people.edit')"
                class="interactive flex size-8 items-center justify-center rounded-md text-muted hover:text-highlighted hover:bg-elevated"
                @click="openEditPerson(person, $event)"
              >
                <Icon name="lucide:pencil" size="15" />
              </button>

              <Icon name="lucide:chevron-right" size="18" class="text-dimmed" />
            </div>
          </UiElement>
        </div>
      </div>
    </div>

    <!-- Add / Edit Person Modal -->
    <UModal v-model:open="isModalOpen" :title="editingPersonId ? t('people.edit') : t('people.new')">
      <template #body>
        <form class="grid gap-3.5 p-4" @submit.prevent="handleSavePerson">
          <div>
            <label class="block text-xs font-medium text-muted pb-1.5">
              {{ t('people.name') }} *
            </label>
            <UInput
              v-model="personName"
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
              v-model="personPhone"
              placeholder="e.g. +1 555 0192"
              size="md"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" color="neutral" @click="isModalOpen = false">
              {{ t('base.cancel') }}
            </UButton>
            <UButton type="submit" color="primary" :disabled="!personName.trim()">
              {{ t('base.save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </UiPage>
</template>
