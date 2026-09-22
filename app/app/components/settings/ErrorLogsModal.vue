<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { formatErrorLogsAsText, useErrorLogs } from '~/composables/useErrorLogs'
import { showSuccessToast } from '~/composables/useStoreSync'

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { clearErrorLogs, errorLogs, hasErrors } = useErrorLogs()
const { copy } = useClipboard()

const search = ref('')
const expandedId = ref<string | null>(null)

const filteredLogs = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query)
    return [...errorLogs.value].reverse()

  return [...errorLogs.value]
    .reverse()
    .filter(e =>
      e.source.toLowerCase().includes(query)
      || e.message.toLowerCase().includes(query)
      || (e.details && e.details.toLowerCase().includes(query)),
    )
})

function handleCopyAll() {
  const text = formatErrorLogsAsText()
  copy(text)
  showSuccessToast('alerts.copied')
}

function handleClear() {
  clearErrorLogs()
  showSuccessToast('alerts.saved')
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  catch {
    return String(ts)
  }
}
</script>

<template>
  <UModal :open="true" :title="t('settings.errorLogs', 'Diagnostics & Error Logs')" @update:open="emit('close')">
    <template #body>
      <div class="space-y-4 p-4 max-h-[70vh] flex flex-col">
        <!-- Controls -->
        <div class="flex items-center justify-between gap-2 shrink-0">
          <input
            v-model="search"
            type="text"
            :placeholder="t('base.search', 'Search logs...')"
            class="flex-1 text-sm py-1.5 px-3 rounded-md border border-default/20 bg-elevated/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            icon="hugeicons:copy-01"
            :disabled="!hasErrors"
            @click="handleCopyAll"
          >
            {{ t('base.copy', 'Copy All') }}
          </UButton>
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="hugeicons:delete-02"
            :disabled="!hasErrors"
            @click="handleClear"
          >
            {{ t('base.delete', 'Clear') }}
          </UButton>
        </div>

        <!-- Log List -->
        <div v-if="filteredLogs.length" class="space-y-2 overflow-y-auto flex-1 pr-1">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="p-2.5 rounded-lg border border-default/15 bg-elevated/30 text-xs cursor-pointer hover:bg-elevated/60 transition-colors"
            @click="toggleExpand(log.id)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-error/15 text-error font-medium">
                {{ log.source }}
              </span>
              <span class="text-muted text-[11px] font-mono">
                {{ formatDate(log.timestamp) }}
              </span>
            </div>
            <p class="font-medium text-highlighted mt-1.5 break-words">
              {{ log.message }}
            </p>

            <div v-if="expandedId === log.id" class="mt-2 pt-2 border-t border-default/10 space-y-2">
              <div v-if="log.details" class="p-2 rounded bg-default/10 font-mono text-[11px] break-all whitespace-pre-wrap">
                <span class="text-muted font-sans font-semibold block mb-0.5">Details:</span>
                {{ log.details }}
              </div>
              <div v-if="log.stack" class="p-2 rounded bg-default/10 font-mono text-[10px] break-all whitespace-pre-wrap max-h-32 overflow-y-auto text-muted">
                {{ log.stack }}
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-muted text-sm">
          <UIcon name="hugeicons:checkmark-circle-02" class="size-8 text-emerald-500 mx-auto mb-2 opacity-80" />
          <p>{{ t('settings.noErrors', 'No errors recorded. Everything is running smoothly!') }}</p>
        </div>

        <!-- Footer -->
        <div class="flex justify-end pt-2 shrink-0">
          <UButton variant="ghost" color="neutral" @click="emit('close')">
            {{ t('base.close', 'Close') }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
