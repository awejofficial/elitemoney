<script setup lang="ts">
import { useStorage } from '@vueuse/core'

import type { CategoryId } from '~/components/categories/types'
import type { StatTabSlug } from '~/components/stat/types'
import type { WalletId } from '~/components/wallets/types'

import { useStatDate } from '~/components/date/useStatDate'
import { defaultStatDateParams } from '~/components/date/statDateParams'
import { useFilter } from '~/components/stat/filter/useFilter'
import { filterKey, statConfigKey, statDateKey } from '~/components/stat/injectionKeys'
import { useStatConfig } from '~/components/stat/useStatConfig'
import { useTrnsStore } from '~/components/trns/useTrnsStore'

const { t } = useI18n()
const route = useRoute()
const trnsStore = useTrnsStore()

const filter = useFilter()
provide(filterKey, filter)

const activeTab = useStorage<StatTabSlug>('dashboard-tab', 'summary')
const storageKey = computed(() => `dashboard-${activeTab.value}`)

const trnsIds = computed(() => trnsStore.getStoreTrnsIds({
  categoriesIds: filter?.categoriesIds?.value,
  walletsIds: filter?.walletsIds?.value,
}))

const maxRange = computed(() => trnsStore.getRange(trnsIds.value))

const statConfig = useStatConfig({
  storageKey: storageKey.value,
})
provide(statConfigKey, statConfig)

const statDate = useStatDate({ key: storageKey.value, maxRange, queryParams: route.query })
provide(statDateKey, statDate)

watch(filter.categoriesIds, () => {
  statConfig.config.value.isShowEmptyCategories = filter.categoriesIds.value.length > 0
})

// Detect when date range produces zero results but transactions exist
const datedTrnsIds = computed(() => trnsStore.getStoreTrnsIds({
  dates: {
    end: statDate.range.value.end,
    start: statDate.range.value.start,
  },
  trnsIds: trnsIds.value,
}))
const isDateRangeEmpty = computed(() =>
  trnsIds.value.length > 0 && datedTrnsIds.value.length === 0,
)

function resetDateRange() {
  statDate.params.value = { ...defaultStatDateParams }
}

const lastFilter = useStorage<{
  categoriesIds: CategoryId[]
  walletsIds: WalletId[]
}>('finapp.dashboard.lastFilter', {
  categoriesIds: [],
  walletsIds: [],
}, localStorage, {
  mergeDefaults: true,
})

onActivated(() => {
  filter.setCategories(lastFilter.value.categoriesIds ?? [])
  filter.setWallets(lastFilter.value.walletsIds ?? [])
})

onDeactivated(() => {
  lastFilter.value.categoriesIds = filter.categoriesIds.value
  lastFilter.value.walletsIds = filter.walletsIds.value
})

useSeoMeta({
  ogTitle: t('stat.title'),
  titleTemplate: t('stat.title'),
})
</script>

<template>
  <UiPage>
    <StatHeader
      v-model:activeTab="activeTab"
      :trnsIds
      configCategories
      configWallets
      filterCategories
      filterWallets
    >
      <template #title>
        <UiHeaderTitle>{{ t('stat.title') }}</UiHeaderTitle>
      </template>
    </StatHeader>

    <!-- Empty date range recovery banner -->
    <div
      v-if="isDateRangeEmpty"
      class="mx-2 mb-3 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 lg:mx-4 2xl:mx-8"
    >
      <div class="flex items-center gap-2 min-w-0">
        <Icon name="lucide:calendar-x-2" size="18" class="text-amber-500 shrink-0" />
        <span class="text-xs text-amber-500 font-medium truncate">
          {{ t('stat.noDataInRange') }}
        </span>
      </div>
      <button
        type="button"
        class="interactive shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-500 hover:bg-amber-500/25"
        @click="resetDateRange"
      >
        {{ t('stat.resetRange') }}
      </button>
    </div>

    <StatWrap
      :activeTab
      :range="statDate.range.value"
      :storageKey
      :trnsIds
      hasChildren
    />
  </UiPage>
</template>

