<script setup lang="ts">
import { useStorage } from '@vueuse/core'

import type { CategoryId } from '~/components/categories/types'

import { useCategoriesExpanded } from '~/components/categories/useCategoriesExpanded'
import { useCategoriesStore } from '~/components/categories/useCategoriesStore'
import { isMenuableCategory, useCategoryMenuItems } from '~/components/categories/useCategoryMenuItems'
import { useTrnsStore } from '~/components/trns/useTrnsStore'
import { showErrorToast, showSuccessToast } from '~/composables/useStoreSync'

const { t } = useI18n()
const categoriesStore = useCategoriesStore()
const trnsStore = useTrnsStore()

const { folderIcon, isExpanded, toggle, toggleAll } = useCategoriesExpanded(
  'categoriesPage',
  computed(() => categoriesStore.categoriesRootIds),
)

useHead({ title: t('categories.title') })

const categoriesView = useStorage<'list' | 'grid'>('finapp.categoriesView', 'list', localStorage, {
  mergeDefaults: true,
})

const isPresetsModalOpen = ref(false)
const selectedPackForModal = ref('essentials')
const deleteCategoryId = ref<CategoryId | null>(null)

const deleteTrnsCount = computed(() => {
  if (!deleteCategoryId.value)
    return 0
  return trnsStore.getStoreTrnsIds({
    categoriesIds: categoriesStore.getChildrenIdsOrParent(deleteCategoryId.value),
  }).length
})

const deleteDescText = computed(() =>
  deleteTrnsCount.value > 0 ? t('categories.form.delete.alertWithTrns') : undefined,
)

const deleteHighlight = computed(() =>
  deleteTrnsCount.value > 0 ? t('trns.plural', deleteTrnsCount.value) : undefined,
)

function onClickDelete(categoryId: CategoryId) {
  for (const id of Object.keys(categoriesStore.items)) {
    if (categoriesStore.items[id]?.parentId === categoryId) {
      showErrorToast('categories.form.delete.errorChildren')
      return
    }
  }
  deleteCategoryId.value = categoryId
}

async function onDeleteConfirm() {
  if (!deleteCategoryId.value)
    return

  const categoryId = deleteCategoryId.value
  const trnsIds = [...trnsStore.getStoreTrnsIds({
    categoriesIds: categoriesStore.getChildrenIdsOrParent(categoryId),
  })]

  deleteCategoryId.value = null
  await categoriesStore.deleteCategory(categoryId, trnsIds)

  setTimeout(() => {
    showSuccessToast(trnsIds.length > 0
      ? 'categories.form.delete.okWithTrns'
      : 'categories.form.delete.okWithoutTrns', trnsIds.length > 0
      ? { length: trnsIds.length, trns: t('trns.plural', trnsIds.length) }
      : undefined)
  }, 300)
}

const categoryMenu = useCategoryMenuItems()

function getCategoryContextMenuItems(categoryId: CategoryId) {
  if (!isMenuableCategory(categoryId))
    return undefined
  const open = categoryMenu.open(categoryId)
  return [
    [...(open ? [open] : []), categoryMenu.edit(categoryId)],
    [categoryMenu.delete(categoryId, onClickDelete)],
  ]
}
</script>

<template>
  <UiPage>
    <UiHeader>
      <UiHeaderTitle>{{ t('categories.name') }}</UiHeaderTitle>
      <template #actions>
        <UiActionButton
          :ariaLabel="$t('base.toggleFolders')"
          @click="toggleAll"
        >
          <Icon :name="folderIcon" size="20" />
        </UiActionButton>

        <UiActionButton :ariaLabel="$t('base.toggleView')" @click="categoriesView = categoriesView === 'list' ? 'grid' : 'list'">
          <Icon
            :name="categoriesView === 'list' ? 'lucide:layout-grid' : 'lucide:list'"
            size="20"
          />
        </UiActionButton>

        <UiActionButton
          :ariaLabel="t('categories.presets.modalTitle')"
          @click="selectedPackForModal = 'essentials'; isPresetsModalOpen = true"
        >
          <Icon name="lucide:sparkles" size="20" />
        </UiActionButton>

        <NuxtLink to="/categories/new">
          <UiActionButton :ariaLabel="$t('categories.new')">
            <Icon name="lucide:plus" size="24" />
          </UiActionButton>
        </NuxtLink>
      </template>
    </UiHeader>

    <!-- Empty State: Guided Starter Packs -->
    <div
      v-if="categoriesStore.categoriesRootIds.length === 0"
      class="flex-center grow flex-col px-4 py-8 max-w-xl mx-auto text-center"
    >
      <div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-inner">
        <Icon name="lucide:sparkles" size="26" />
      </div>

      <UiTitleSection class="pb-1">
        {{ t('categories.presets.emptyTitle') }}
      </UiTitleSection>
      <p class="text-xs text-muted max-w-md pb-5 leading-relaxed">
        {{ t('categories.presets.emptySubtitle') }}
      </p>

      <!-- Quick starter pack cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pb-5 text-left">
        <div
          class="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center gap-1.5 pb-1 text-primary">
              <Icon name="mdi:view-dashboard-outline" size="16" />
              <span class="text-xs font-semibold">{{ t('categories.presets.essentials.name') }}</span>
            </div>
            <div class="text-3xs text-muted leading-snug">
              {{ t('categories.presets.essentials.desc') }}
            </div>
          </div>
          <div class="pt-3">
            <UButton
              color="primary"
              size="xs"
              block
              @click="selectedPackForModal = 'essentials'; isPresetsModalOpen = true"
            >
              {{ t('categories.presets.previewAndAdd') }}
            </UButton>
          </div>
        </div>

        <div
          class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center gap-1.5 pb-1 text-amber-500">
              <Icon name="mdi:school" size="16" />
              <span class="text-xs font-semibold">{{ t('categories.presets.student.name') }}</span>
            </div>
            <div class="text-3xs text-muted leading-snug">
              {{ t('categories.presets.student.desc') }}
            </div>
          </div>
          <div class="pt-3">
            <UButton
              color="neutral"
              variant="subtle"
              size="xs"
              block
              @click="selectedPackForModal = 'student'; isPresetsModalOpen = true"
            >
              {{ t('categories.presets.previewAndAdd') }}
            </UButton>
          </div>
        </div>

        <div
          class="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center gap-1.5 pb-1 text-purple-500">
              <Icon name="mdi:laptop" size="16" />
              <span class="text-xs font-semibold">{{ t('categories.presets.freelance.name') }}</span>
            </div>
            <div class="text-3xs text-muted leading-snug">
              {{ t('categories.presets.freelance.desc') }}
            </div>
          </div>
          <div class="pt-3">
            <UButton
              color="neutral"
              variant="subtle"
              size="xs"
              block
              @click="selectedPackForModal = 'freelance'; isPresetsModalOpen = true"
            >
              {{ t('categories.presets.previewAndAdd') }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Or blank custom category -->
      <div class="flex items-center gap-2 pt-1">
        <span class="text-2xs text-muted">{{ t('categories.presets.orCreateCustom') }}</span>
        <NuxtLink to="/categories/new" class="text-2xs text-primary hover:underline font-medium">
          {{ t('categories.new') }}
        </NuxtLink>
      </div>
    </div>

    <!-- List -->
    <div
      v-else
      class="max-w-4xl grow px-2 lg:px-4 2xl:px-8"
    >
      <CategoriesList
        :ids="categoriesStore.categoriesRootIds"
        :categoriesItemProps="{
          leftMenuButton: true,
          lineWidth: 1,
        }"
        :childrenView="categoriesView"
        :expanded="{ isExpanded, toggle }"
        :getContextMenuItems="getCategoryContextMenuItems"
        :getTo="(categoryId: CategoryId) => `/categories/${categoryId}`"
      />
    </div>

    <LayoutConfirmModal
      v-if="deleteCategoryId"
      :title="t('categories.form.delete.title')"
      :description="deleteDescText"
      :highlight="deleteHighlight"
      @closed="deleteCategoryId = null"
      @confirm="onDeleteConfirm"
    />

    <CategoriesPresetsModal
      v-model:open="isPresetsModalOpen"
      :initialPackId="selectedPackForModal"
    />
  </UiPage>
</template>
