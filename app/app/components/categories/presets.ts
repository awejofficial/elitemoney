import type { BatchCategoryInput } from '~/components/categories/types'

export type CategoryPresetPack = {
  id: string
  nameKey: string
  descKey: string
  icon: string
  color: string
  categories: (t: (key: string) => string) => BatchCategoryInput[]
}

export const CATEGORY_PRESET_PACKS: CategoryPresetPack[] = [
  {
    id: 'essentials',
    nameKey: 'categories.presets.essentials.name',
    descKey: 'categories.presets.essentials.desc',
    icon: 'mdi:view-dashboard-outline',
    color: '#3b82f6',
    categories: (t: (key: string) => string): BatchCategoryInput[] => [
      {
        name: t('categories.presets.names.food'),
        icon: 'mdi:food-fork-drink',
        color: '#f97316',
        showInLastUsed: true,
        showInQuickSelector: true,
        children: [
          { name: t('categories.presets.names.groceries'), icon: 'mdi:cart-outline', color: '#f97316' },
          { name: t('categories.presets.names.mess'), icon: 'mdi:food-variant', color: '#f97316' },
          { name: t('categories.presets.names.cafes'), icon: 'mdi:coffee', color: '#f97316' },
          { name: t('categories.presets.names.delivery'), icon: 'mdi:truck-delivery', color: '#f97316' },
          { name: t('categories.presets.names.restaurants'), icon: 'mdi:silverware-variant', color: '#f97316' },
        ],
      },
      {
        name: t('categories.presets.names.housing'),
        icon: 'mdi:home-city',
        color: '#3b82f6',
        showInLastUsed: true,
        showInQuickSelector: true,
        children: [
          { name: t('categories.presets.names.rent'), icon: 'mdi:home-currency-usd', color: '#3b82f6' },
          { name: t('categories.presets.names.electricity'), icon: 'mdi:lightning-bolt', color: '#3b82f6' },
          { name: t('categories.presets.names.internet'), icon: 'mdi:wifi', color: '#3b82f6' },
          { name: t('categories.presets.names.water'), icon: 'mdi:water', color: '#3b82f6' },
          { name: t('categories.presets.names.maintenance'), icon: 'mdi:wrench', color: '#3b82f6' },
        ],
      },
      {
        name: t('categories.presets.names.transport'),
        icon: 'mdi:car',
        color: '#06b6d4',
        showInLastUsed: true,
        showInQuickSelector: true,
        children: [
          { name: t('categories.presets.names.fuel'), icon: 'mdi:gas-station', color: '#06b6d4' },
          { name: t('categories.presets.names.transit'), icon: 'mdi:bus-side', color: '#06b6d4' },
          { name: t('categories.presets.names.cab'), icon: 'mdi:taxi', color: '#06b6d4' },
          { name: t('categories.presets.names.parking'), icon: 'mdi:parking', color: '#06b6d4' },
        ],
      },
      {
        name: t('categories.presets.names.shopping'),
        icon: 'mdi:shopping',
        color: '#ec4899',
        showInLastUsed: true,
        children: [
          { name: t('categories.presets.names.clothes'), icon: 'mdi:tshirt-crew', color: '#ec4899' },
          { name: t('categories.presets.names.electronics'), icon: 'mdi:cellphone', color: '#ec4899' },
          { name: t('categories.presets.names.personalCare'), icon: 'mdi:spa', color: '#ec4899' },
          { name: t('categories.presets.names.gifts'), icon: 'mdi:gift-outline', color: '#ec4899' },
        ],
      },
      {
        name: t('categories.presets.names.entertainment'),
        icon: 'mdi:popcorn',
        color: '#8b5cf6',
        showInLastUsed: true,
        children: [
          { name: t('categories.presets.names.subscriptions'), icon: 'mdi:youtube-subscription', color: '#8b5cf6' },
          { name: t('categories.presets.names.movies'), icon: 'mdi:movie-open', color: '#8b5cf6' },
          { name: t('categories.presets.names.gaming'), icon: 'mdi:gamepad-variant', color: '#8b5cf6' },
          { name: t('categories.presets.names.travel'), icon: 'mdi:airplane', color: '#8b5cf6' },
        ],
      },
      {
        name: t('categories.presets.names.health'),
        icon: 'mdi:heart-pulse',
        color: '#ef4444',
        showInLastUsed: true,
        children: [
          { name: t('categories.presets.names.medicines'), icon: 'mdi:pill', color: '#ef4444' },
          { name: t('categories.presets.names.doctor'), icon: 'mdi:stethoscope', color: '#ef4444' },
          { name: t('categories.presets.names.fitness'), icon: 'mdi:dumbbell', color: '#ef4444' },
        ],
      },
      {
        name: t('categories.presets.names.education'),
        icon: 'mdi:school',
        color: '#14b8a6',
        showInLastUsed: true,
        children: [
          { name: t('categories.presets.names.books'), icon: 'mdi:book-open-page-variant', color: '#14b8a6' },
          { name: t('categories.presets.names.courses'), icon: 'mdi:laptop', color: '#14b8a6' },
        ],
      },
      {
        name: t('categories.presets.names.income'),
        icon: 'mdi:cash-multiple',
        color: '#10b981',
        showInLastUsed: true,
        showInQuickSelector: true,
        children: [
          { name: t('categories.presets.names.salary'), icon: 'mdi:briefcase', color: '#10b981' },
          { name: t('categories.presets.names.freelance'), icon: 'mdi:laptop', color: '#10b981' },
          { name: t('categories.presets.names.investments'), icon: 'mdi:chart-line', color: '#10b981' },
          { name: t('categories.presets.names.refunds'), icon: 'mdi:cash-refund', color: '#10b981' },
        ],
      },
    ],
  },
  {
    id: 'student',
    nameKey: 'categories.presets.student.name',
    descKey: 'categories.presets.student.desc',
    icon: 'mdi:school',
    color: '#f59e0b',
    categories: (t: (key: string) => string): BatchCategoryInput[] => [
      {
        name: t('categories.presets.names.mess'),
        icon: 'mdi:food-variant',
        color: '#f97316',
        showInLastUsed: true,
        showInQuickSelector: true,
      },
      {
        name: t('categories.presets.names.canteen'),
        icon: 'mdi:coffee',
        color: '#fb923c',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.hostelRent'),
        icon: 'mdi:home-city',
        color: '#3b82f6',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.books'),
        icon: 'mdi:book-open-page-variant',
        color: '#14b8a6',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.mobileData'),
        icon: 'mdi:wifi',
        color: '#06b6d4',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.busPass'),
        icon: 'mdi:bus-side',
        color: '#6366f1',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.movies'),
        icon: 'mdi:movie-open',
        color: '#8b5cf6',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.pocketMoney'),
        icon: 'mdi:cash-multiple',
        color: '#10b981',
        showInLastUsed: true,
        showInQuickSelector: true,
      },
    ],
  },
  {
    id: 'freelance',
    nameKey: 'categories.presets.freelance.name',
    descKey: 'categories.presets.freelance.desc',
    icon: 'mdi:laptop',
    color: '#8b5cf6',
    categories: (t: (key: string) => string): BatchCategoryInput[] => [
      {
        name: t('categories.presets.names.saasSoftware'),
        icon: 'mdi:laptop',
        color: '#8b5cf6',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.hardware'),
        icon: 'mdi:desktop-mac',
        color: '#6366f1',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.coworking'),
        icon: 'mdi:coffee',
        color: '#f97316',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.fiberInternet'),
        icon: 'mdi:wifi',
        color: '#06b6d4',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.clientMeetings'),
        icon: 'mdi:silverware-variant',
        color: '#ec4899',
        showInLastUsed: true,
      },
      {
        name: t('categories.presets.names.clientInvoices'),
        icon: 'mdi:cash-multiple',
        color: '#10b981',
        showInLastUsed: true,
        showInQuickSelector: true,
      },
      {
        name: t('categories.presets.names.projectBonuses'),
        icon: 'mdi:chart-line',
        color: '#059669',
        showInLastUsed: true,
      },
    ],
  },
]
