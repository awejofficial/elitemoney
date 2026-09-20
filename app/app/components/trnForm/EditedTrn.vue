<script setup lang="ts">
import { useTrnsFormStore } from '~/components/trnForm/useTrnsFormStore'
import { useTrnsStore } from '~/components/trns/useTrnsStore'

const { t } = useI18n()
const trnsStore = useTrnsStore()
const trnsFormStore = useTrnsFormStore()

const showDeleteConfirm = ref(false)

function handleDeleteConfirm() {
  if (trnsFormStore.values.trnId) {
    trnsStore.deleteTrn(trnsFormStore.values.trnId)
    trnsFormStore.onClose()
    showDeleteConfirm.value = false
  }
}

function handleDuplicate() {
  if (trnsFormStore.values.trnId) {
    trnsFormStore.openFormForDuplicate(trnsFormStore.values.trnId)
  }
}
</script>

<template>
  <div
    v-if="trnsFormStore.values.trnId"
    class="grid gap-1.5"
  >
    <div class="flex items-center justify-between text-xs px-1 text-muted">
      <span class="font-medium text-primary flex items-center gap-1">
        <Icon name="lucide:pencil" size="12" />
        {{ t('trnForm.titleEditTrn') }}
      </span>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="interactive text-muted hover:text-highlighted text-2xs flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-elevated"
          @click="handleDuplicate"
        >
          <Icon name="lucide:copy" size="12" />
          {{ t('base.duplicate') }}
        </button>

        <button
          type="button"
          class="interactive text-error/80 hover:text-error text-2xs flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-error/10"
          @click="showDeleteConfirm = true"
        >
          <Icon name="lucide:trash-2" size="12" />
          {{ t('base.delete') }}
        </button>

        <button
          type="button"
          class="interactive text-muted hover:text-highlighted text-2xs px-1.5 py-0.5 rounded hover:bg-elevated"
          @click="trnsFormStore.values.trnId = null"
        >
          {{ t('base.cancel') }}
        </button>
      </div>
    </div>

    <TrnsItem
      v-if="trnsStore.computeTrnItem(trnsFormStore.values.trnId)"
      :trnItem="trnsStore.computeTrnItem(trnsFormStore.values.trnId)!"
      class="group bg-elevated/50 rounded-lg"
    />

    <LayoutConfirmModal
      v-if="showDeleteConfirm"
      :title="t('trnForm.delete.alert')"
      @closed="showDeleteConfirm = false"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
