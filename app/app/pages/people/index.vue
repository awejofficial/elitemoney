<script setup lang="ts">
import { usePeopleStore } from '~/components/people/usePeopleStore'
import { useCurrenciesStore } from '~/components/currencies/useCurrenciesStore'

defineOptions({ name: 'PeoplePage' })

const { t } = useI18n()
const peopleStore = usePeopleStore()
const currenciesStore = useCurrenciesStore()

useSeoMeta({
  title: 'Lending & People — EliteMoney',
  ogTitle: 'Lending & People — EliteMoney',
})

const isAddPersonOpen = ref(false)
const searchQuery = ref('')
const newPersonName = ref('')
const newPersonPhone = ref('')

const filteredPeople = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q)
    return peopleStore.peopleList
  return peopleStore.peopleList.filter(p =>
    p.name.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q),
  )
})

function handleAddPerson() {
  if (!newPersonName.value.trim())
    return
  const id = peopleStore.addPerson(newPersonName.value, newPersonPhone.value)
  newPersonName.value = ''
  newPersonPhone.value = ''
  isAddPersonOpen.value = false
  navigateTo(`/people/${id}`)
}
</script>

<template>
  <UiPage>
    <UiHeader>
      <UiHeaderTitle>
        {{ t('people.title', 'Lending & People') }}
      </UiHeaderTitle>
      <template #actions>
        <UButton
          icon="i-lucide-user-plus"
          size="sm"
          color="primary"
          variant="solid"
          @click="isAddPersonOpen = true"
        >
          {{ t('people.addPerson', 'Add Person') }}
        </UButton>
      </template>
    </UiHeader>

    <div class="pageWrapper">
      <div class="grid gap-4 px-2 pt-2 pb-16 @3xl/main:max-w-2xl">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-default bg-elevated/40 p-4 backdrop-blur">
            <div class="text-xs font-medium text-muted">
              {{ t('people.owesYou', 'Owed to You') }}
            </div>
            <div class="pt-1 text-xl font-bold text-emerald-500 font-brand">
              +{{ peopleStore.totalOwedToYou }} {{ currenciesStore.base }}
            </div>
            <div class="text-2xs text-dimmed pt-0.5">
              {{ t('people.receivables', 'Receivables') }}
            </div>
          </div>

          <div class="rounded-xl border border-default bg-elevated/40 p-4 backdrop-blur">
            <div class="text-xs font-medium text-muted">
              {{ t('people.youOwe', 'You Owe') }}
            </div>
            <div class="pt-1 text-xl font-bold text-rose-500 font-brand">
              -{{ peopleStore.totalYouOwe }} {{ currenciesStore.base }}
            </div>
            <div class="text-2xs text-dimmed pt-0.5">
              {{ t('people.payables', 'Payables') }}
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div v-if="peopleStore.peopleList.length > 0">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            :placeholder="t('people.searchPlaceholder', 'Search people...')"
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
            <UIcon name="i-lucide-users" class="size-7" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-highlighted">
              {{ t('people.noPeopleYet', 'No contacts yet') }}
            </h3>
            <p class="text-xs text-muted pt-1 max-w-xs">
              {{ t('people.emptyDesc', 'Track money lent to or borrowed from friends, family, and colleagues.') }}
            </p>
          </div>
          <UButton
            icon="i-lucide-user-plus"
            size="md"
            color="primary"
            class="mt-2"
            @click="isAddPersonOpen = true"
          >
            {{ t('people.addFirstPerson', 'Add first contact') }}
          </UButton>
        </div>

        <!-- People List -->
        <div v-else class="flex flex-col divide-y divide-default overflow-hidden rounded-2xl border border-default bg-elevated/30">
          <NuxtLink
            v-for="person in filteredPeople"
            :key="person.id"
            :to="`/people/${person.id}`"
            class="interactive flex items-center justify-between p-3.5 transition-colors hover:bg-elevated/60"
          >
            <div class="flex items-center gap-3">
              <!-- Avatar -->
              <div class="flex size-10 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-sm uppercase">
                {{ person.name.charAt(0) }}
              </div>
              <div>
                <div class="font-medium text-highlighted text-sm">
                  {{ person.name }}
                </div>
                <div v-if="person.phone" class="text-2xs text-muted">
                  {{ person.phone }}
                </div>
              </div>
            </div>

            <!-- Balance Pill -->
            <div class="flex items-center gap-2">
              <div class="text-right">
                <template v-if="peopleStore.balances[person.id]">
                  <div
                    v-if="peopleStore.balances[person.id]!.netBalance > 0"
                    class="text-xs font-semibold text-emerald-500"
                  >
                    +{{ peopleStore.balances[person.id]!.netBalance }} {{ currenciesStore.base }}
                    <div class="text-3xs text-emerald-500/70 font-normal">
                      {{ t('people.owesYouShort', 'owes you') }}
                    </div>
                  </div>
                  <div
                    v-else-if="peopleStore.balances[person.id]!.netBalance < 0"
                    class="text-xs font-semibold text-rose-500"
                  >
                    -{{ Math.abs(peopleStore.balances[person.id]!.netBalance) }} {{ currenciesStore.base }}
                    <div class="text-3xs text-rose-500/70 font-normal">
                      {{ t('people.youOweShort', 'you owe') }}
                    </div>
                  </div>
                  <div v-else class="text-xs text-muted">
                    {{ t('people.settled', 'Settled up') }}
                  </div>
                </template>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed" />
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Add Person Modal -->
    <UModal v-model:open="isAddPersonOpen" :title="t('people.addPerson', 'Add Person')">
      <template #body>
        <form class="grid gap-3 p-4" @submit.prevent="handleAddPerson">
          <div>
            <label class="block text-xs font-medium text-muted pb-1">
              {{ t('people.nameLabel', 'Full Name') }} *
            </label>
            <UInput
              v-model="newPersonName"
              placeholder="e.g. Alex Rivera"
              size="md"
              autofocus
              required
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-muted pb-1">
              {{ t('people.phoneLabel', 'Phone or Note (optional)') }}
            </label>
            <UInput
              v-model="newPersonPhone"
              placeholder="e.g. +1 555 0192"
              size="md"
            />
          </div>

          <div class="flex justify-end gap-2 pt-3">
            <UButton variant="ghost" color="neutral" @click="isAddPersonOpen = false">
              {{ t('base.cancel', 'Cancel') }}
            </UButton>
            <UButton type="submit" color="primary" :disabled="!newPersonName.trim()">
              {{ t('base.save', 'Save') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </UiPage>
</template>
