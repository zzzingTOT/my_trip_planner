/**
 * Trip Store — Pinia 全局行程状态
 *
 * 管理:
 * - currentPlan: 当前会话行程（替代 sessionStorage 传参）
 * - history: 行程历史列表（localStorage 持久化）
 * - formCache: 首页表单缓存（刷新不丢失）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TripPlan, TripFormData } from '@/types'

const HISTORY_KEY = 'trip_history_v1'
const FORM_CACHE_KEY = 'trip_form_cache_v1'
const MAX_HISTORY = 30

export interface TripHistoryItem {
  id: string          // 唯一ID
  title: string       // 行程标题
  departure: string   // 出发城市
  destinations: string[] // 目的地列表
  startDate: string
  endDate: string
  days: number
  totalBudget: number
  plan: TripPlan      // 完整行程数据
  createdAt: string   // ISO时间戳
}

function loadHistory(): TripHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(items: TripHistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)))
  } catch {
    // quota exceeded — silently ignore
  }
}

function loadFormCache(): Partial<TripFormData> | null {
  try {
    const raw = localStorage.getItem(FORM_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveFormCache(data: TripFormData) {
  try {
    // 不缓存日期（Dayjs序列化问题）
    const { start_date, end_date, ...rest } = data as any
    localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(rest))
  } catch {
    // ignore
  }
}

export const useTripStore = defineStore('trip', () => {
  // ---- 状态 ----
  const currentPlan = ref<TripPlan | null>(null)
  const history = ref<TripHistoryItem[]>(loadHistory())
  const formCache = ref<Partial<TripFormData> | null>(loadFormCache())

  // ---- 计算属性 ----
  const hasCurrentPlan = computed(() => currentPlan.value !== null)
  const historyCount = computed(() => history.value.length)

  // ---- 行程操作 ----
  function setCurrentPlan(plan: TripPlan) {
    currentPlan.value = plan
    // 同时存入sessionStorage（兼容旧代码）
    sessionStorage.setItem('tripPlan', JSON.stringify(plan))
  }

  function addToHistory(plan: TripPlan) {
    // 去重：同目的地+同日期视为同一行程
    const dup = history.value.find(h =>
      h.departure === plan.departure_city &&
      h.destinations.join(',') === plan.cities.join(',') &&
      h.startDate === plan.start_date
    )
    if (dup) {
      // 更新已有记录
      dup.plan = plan
      dup.title = plan.cities.join(' → ') + '旅行'
      dup.createdAt = new Date().toISOString()
      dup.totalBudget = plan.budget?.total || 0
    } else {
      const item: TripHistoryItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title: plan.cities.join(' → ') + '旅行',
        departure: plan.departure_city,
        destinations: plan.cities,
        startDate: plan.start_date,
        endDate: plan.end_date,
        days: plan.days.length,
        totalBudget: plan.budget?.total || 0,
        plan,
        createdAt: new Date().toISOString(),
      }
      history.value.unshift(item)
    }
    saveHistory(history.value)
  }

  function removeFromHistory(id: string) {
    history.value = history.value.filter(h => h.id !== id)
    saveHistory(history.value)
  }

  function getHistoryPlan(id: string): TripPlan | null {
    const item = history.value.find(h => h.id === id)
    return item?.plan || null
  }

  function getReuseFormData(id: string): TripFormData | null {
    const item = history.value.find(h => h.id === id)
    if (!item) return null
    return {
      departure_city: item.departure,
      cities: item.destinations,
      start_date: item.startDate,
      end_date: item.endDate,
      travel_days: item.days,
      transportation: item.plan.days[0]?.transportation || '公共交通',
      accommodation: item.plan.days[0]?.accommodation || '经济型酒店',
      preferences: [],
      free_text_input: '',
    }
  }

  // ---- 表单缓存 ----
  function cacheForm(data: TripFormData) {
    formCache.value = { ...data }
    saveFormCache(data)
  }

  function clearFormCache() {
    formCache.value = null
    localStorage.removeItem(FORM_CACHE_KEY)
  }

  return {
    currentPlan,
    history,
    formCache,
    hasCurrentPlan,
    historyCount,
    setCurrentPlan,
    addToHistory,
    removeFromHistory,
    getHistoryPlan,
    getReuseFormData,
    cacheForm,
    clearFormCache,
  }
})
