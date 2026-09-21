<script setup lang="ts">
import { CATEGORY_PRESET_PACKS, type CategoryPresetPack } from '~/components/categories/presets'
import { useCategoriesStore } from '~/components/categories/useCategoriesStore'
import { showSuccessToast } from '~/composables/useStoreSync'

const props = defineProps<{
  initialPackId?: string
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const categoriesStore = useCategoriesStore()

const selectedPackId = ref<string>(props.initialPackId || 'essentials')
const isSaving = ref(false)

const currentPack = computed<CategoryPresetPack>(() =>
  CATEGORY_PRESET_PACKS.find(p => p.id === selectedPackId.value) || CATEGORY_PRESET_PACKS[0]!,
)

const packCategories = computed(() =>
  currentPack.value.categories(t),
)

// Set of existing category names in database (lowercased for case-insensitive matching)
const existingCategoryNames = computed(() => {
  const set = new Set<string>()
  for (const cat of Object.values(categoriesStore.items ?? {})) {
    if (cat.name)
      set.add(cat.name.trim().toLowerCase())
  }
  return set
})

function isAlreadyAdded(catName: string) {
  return existingCategoryNames.value.has(catName.trim().toLowerCase())
}

// Track which root categories are checked
const selectedCategoryNames = ref<Set<string>>(new Set())

watch([currentPack, existingCategoryNames], () => {
  // Select all new categories by default when switching pack, excluding ones already in DB
  selectedCategoryNames.value = new Set(
    packCategories.value
      .filter(c => !isAlreadyAdded(c.name))
      .map(c => c.name),
  )
}, { immediate: true })

function toggleCategory(name: string) {
  if (isAlreadyAdded(name))
    return
  const next = new Set(selectedCategoryNames.value)
  if (next.has(name))
    next.delete(name)
  else
    next.add(name)
  selectedCategoryNames.value = next
}

function selectAll() {
  selectedCategoryNames.value = new Set(
    packCategories.value
      .filter(c => !isAlreadyAdded(c.name))
      .map(c => c.name),
  )
}

function deselectAll() {
  selectedCategoryNames.value = new Set()
}

async function handleImport() {
  const categoriesToSave = packCategories.value.filter(c =>
    selectedCategoryNames.value.has(c.name) && !isAlreadyAdded(c.name),
  )

  if (!categoriesToSave.length)
    return

  isSaving.value = true
  try {
    await categoriesStore.saveCategoriesBatch(categoriesToSave)
    isOpen.value = false
    showSuccessToast('categories.presets.importedSuccess')
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('categories.presets.modalTitle')"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <div class="grid gap-4 p-4">
        <!-- Pack Selector Tabs -->
        <div>
          <label class="block text-xs font-medium text-muted pb-2">
            {{ t('categories.presets.choosePack') }}
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              v-for="pack in CATEGORY_PRESET_PACKS"
              :key="pack.id"
              type="button"
              class="interactive flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all"
              :class="[
                selectedPackId === pack.id
                  ? 'border-primary bg-primary/10 text-highlighted shadow-sm ring-1 ring-primary/40'
                  : 'border-default bg-elevated/20 text-muted hover:bg-elevated/40 hover:text-highlighted',
              ]"
              @click="selectedPackId = pack.id"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-lg"
                :style="{ backgroundColor: `${pack.color}20`, color: pack.color }"
              >
                <Icon :name="pack.icon" size="18" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate leading-tight">
                  {{ t(pack.nameKey) }}
                </div>
              </div>
            </button>
          </div>
          <div class="text-xs text-muted pt-2">
            {{ t(currentPack.descKey) }}
          </div>
        </div>

        <!-- Category Preview & Selection -->
        <div class="border-t border-default/60 pt-3">
          <div class="flex items-center justify-between pb-2">
            <div class="text-xs font-medium text-muted">
              {{ t('categories.presets.previewTitle') }} ({{ selectedCategoryNames.size }}/{{ packCategories.length }})
            </div>
            <div class="flex items-center gap-2 text-2xs">
              <button
                type="button"
                class="interactive text-primary hover:underline"
                @click="selectAll"
              >
                {{ t('base.selectAll') }}
              </button>
              <span class="text-muted">•</span>
              <button
                type="button"
                class="interactive text-muted hover:text-highlighted"
                @click="deselectAll"
              >
                {{ t('base.clear') }}
              </button>
            </div>
          </div>

          <div class="max-h-72 overflow-y-auto pr-1 space-y-2.5">
            <div
              v-for="cat in packCategories"
              :key="cat.name"
              class="rounded-xl border p-2.5 transition-all"
              :class="[
                isAlreadyAdded(cat.name)
                  ? 'border-default/30 bg-elevated/10 opacity-60 cursor-default'
                  : selectedCategoryNames.has(cat.name)
                    ? 'border-primary/60 bg-elevated/40 shadow-xs cursor-pointer'
                    : 'border-default bg-elevated/20 opacity-50 cursor-pointer',
              ]"
              @click="toggleCategory(cat.name)"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="flex size-7 shrink-0 items-center justify-center rounded-lg text-white"
                    :style="{ backgroundColor: cat.color }"
                  >
                    <Icon :name="cat.icon" size="16" />
                  </div>
                  <div class="flex items-center gap-1.5 min-w-0 truncate">
                    <span class="text-xs font-medium text-highlighted truncate">
                      {{ cat.name }}
                    </span>
                    <span
                      v-if="isAlreadyAdded(cat.name)"
                      class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-3xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0"
                    >
                      <Icon name="lucide:check" size="10" />
                      {{ t('categories.presets.alreadyAddedBadge') }}
                    </span>
                  </div>
                </div>

                <div v-if="isAlreadyAdded(cat.name)" class="text-2xs text-emerald-400 font-medium flex items-center pr-1 shrink-0">
                  <Icon name="lucide:check-circle" size="16" />
                </div>
                <div
                  v-else
                  class="flex size-5 shrink-0 items-center justify-center rounded-md border text-white transition-all"
                  :class="[
                    selectedCategoryNames.has(cat.name)
                      ? 'bg-primary border-primary'
                      : 'border-default bg-transparent',
                  ]"
                >
                  <Icon
                    v-if="selectedCategoryNames.has(cat.name)"
                    name="lucide:check"
                    size="12"
                  />
                </div>
              </div>

              <!-- Subcategories preview pills -->
              <div
                v-if="cat.children?.length"
                class="flex flex-wrap gap-1.5 pt-2 pl-9"
              >
                <span
                  v-for="sub in cat.children"
                  :key="sub.name"
                  class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-3xs font-medium bg-elevated text-muted border border-default/50"
                >
                  <Icon :name="sub.icon" size="10" />
                  <span>{{ sub.name }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="flex items-center justify-between pt-2 border-t border-default/60">
          <span class="text-3xs text-muted">
            {{ t('categories.presets.dbNotice') }}
          </span>
          <div class="flex gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              @click="isOpen = false"
            >
              {{ t('base.cancel') }}
            </UButton>
            <UButton
              color="primary"
              size="sm"
              :loading="isSaving"
              :disabled="selectedCategoryNames.size === 0"
              @click="handleImport"
            >
              {{ t('categories.presets.addSelected') }} ({{ selectedCategoryNames.size }})
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
