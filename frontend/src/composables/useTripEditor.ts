/**
 * useTripEditor — 行程编辑器核心 composable
 *
 * 职责：
 * - 行程数据的统一操作层（增删改查所有节点/天数）
 * - 操作历史快照栈（undo/redo，最多20步）
 * - 预算自动重算（按类型分类汇总 + 数值校验）
 * - localStorage 防抖草稿（2秒延迟 + 版本号 + 恢复确认）
 * - dirty 状态追踪
 *
 * 数据结构版本号：同步更新前端 types 和 localStorage 草稿版本
 */
import { ref, watch, computed, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import type {
  TripPlan, DayPlan, Attraction, Meal, Hotel,
  InterCityTransport, Budget, Location,
} from '@/types'

// ============ 常量 ============

/** 数据结构版本号 — 升级types后递增，旧版本草稿提示兼容 */
const SCHEMA_VERSION = 1

/** 操作历史栈最大深度 */
const MAX_HISTORY_SIZE = 20

/** localStorage 草稿 key 前缀 */
const DRAFT_KEY_PREFIX = 'trip_editor_draft_v'

/** 防抖延迟（毫秒） */
const DEBOUNCE_MS = 2000

// ============ 工具函数 ============

/** 深拷贝 — 快照保存用 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/** 生成草稿 key */
function getDraftKey(plan: TripPlan): string {
  const id = `${plan.departure_city}_${plan.cities.join('_')}_${plan.start_date}`
  return `${DRAFT_KEY_PREFIX}${SCHEMA_VERSION}_${id}`
}

/** 创建空白景点 */
export function createEmptyAttraction(): Attraction {
  return {
    name: '新景点',
    address: '',
    location: { longitude: 0, latitude: 0 },
    visit_duration: 60,
    description: '',
    category: '景点',
    ticket_price: 0,
  }
}

/** 创建空白餐食 */
export function createEmptyMeal(type: Meal['type'] = 'lunch'): Meal {
  return {
    type,
    name: type === 'breakfast' ? '早餐' : type === 'lunch' ? '午餐' : '晚餐',
    description: '',
    estimated_cost: 0,
  }
}

/** 创建空白酒店 */
export function createEmptyHotel(): Hotel {
  return {
    name: '待选酒店',
    address: '',
    price_range: '',
    rating: '',
    distance: '',
    type: '经济型酒店',
    estimated_cost: 0,
  }
}

/** 创建空白交通方案 */
export function createEmptyTransport(fromCity = '', toCity = ''): InterCityTransport {
  return {
    from_city: fromCity,
    to_city: toCity,
    mode: '高铁',
    duration: '',
    estimated_cost: 0,
    description: '',
  }
}

// ============ 主 Composable ============

export interface TripEditorState {
  editMode: Ref<boolean>
  isDirty: Ref<boolean>
  viewMode: Ref<'list' | 'kanban'>
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  draftExists: Ref<boolean>
  draftDate: Ref<string>
}

export function useTripEditor(tripPlan: Ref<TripPlan | null>) {
  // ---- 状态 ----
  const editMode = ref(false)
  const isDirty = ref(false)
  const viewMode = ref<'list' | 'kanban'>('list')
  const draftExists = ref(false)
  const draftDate = ref('')

  // 操作历史栈
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  // 防抖定时器
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // ---- 快照管理 ----

  /** 保存当前状态到撤销栈 */
  function pushSnapshot() {
    if (!tripPlan.value) return
    const snapshot = deepClone(tripPlan.value)
    undoStack.value.push(JSON.stringify(snapshot))
    if (undoStack.value.length > MAX_HISTORY_SIZE) {
      undoStack.value.shift()
    }
    // 清空重做栈（新操作后不能 redo 旧路径）
    redoStack.value = []
    isDirty.value = true
  }

  /** 撤销 */
  function undo() {
    if (!tripPlan.value || undoStack.value.length === 0) return
    // 当前状态入重做栈
    redoStack.value.push(JSON.stringify(deepClone(tripPlan.value)))
    // 恢复上一个快照
    const snapshot = JSON.parse(undoStack.value.pop()!)
    Object.assign(tripPlan.value, snapshot)
    isDirty.value = true
    message.info('已撤销')
  }

  /** 重做 */
  function redo() {
    if (!tripPlan.value || redoStack.value.length === 0) return
    // 当前状态入撤销栈
    undoStack.value.push(JSON.stringify(deepClone(tripPlan.value)))
    // 恢复重做快照
    const snapshot = JSON.parse(redoStack.value.pop()!)
    Object.assign(tripPlan.value, snapshot)
    isDirty.value = true
    message.info('已重做')
  }

  // ---- Day 操作 ----

  function addDay(afterIndex?: number) {
    if (!tripPlan.value) return
    pushSnapshot()

    const idx = afterIndex !== undefined ? afterIndex + 1 : tripPlan.value.days.length
    const prevDay = afterIndex !== undefined ? tripPlan.value.days[afterIndex] : tripPlan.value.days[tripPlan.value.days.length - 1]

    const newDay: DayPlan = {
      date: prevDay?.date || tripPlan.value.start_date,
      day_index: idx,
      city: prevDay?.city || tripPlan.value.cities[0] || '',
      description: `第${idx + 1}天行程`,
      transportation: prevDay?.transportation || '公共交通',
      accommodation: prevDay?.accommodation || '经济型酒店',
      attractions: [],
      meals: [
        createEmptyMeal('breakfast'),
        createEmptyMeal('lunch'),
        createEmptyMeal('dinner'),
      ],
    }

    tripPlan.value.days.splice(idx, 1, newDay)
    _reindexDays()
    autoRecalculateBudget()
    message.success(`已添加第${idx + 1}天`)
  }

  function deleteDay(dayIndex: number) {
    if (!tripPlan.value) return
    if (tripPlan.value.days.length <= 1) {
      message.warning('至少保留一天行程')
      return
    }
    pushSnapshot()
    tripPlan.value.days.splice(dayIndex, 1)
    _reindexDays()
    autoRecalculateBudget()
    message.success(`已删除第${dayIndex + 1}天`)
  }

  function duplicateDay(dayIndex: number) {
    if (!tripPlan.value) return
    pushSnapshot()
    const source = deepClone(tripPlan.value.days[dayIndex])
    source.day_index = dayIndex + 1
    source.description = source.description.replace(/\d+/g, (m: string) => String(Number(m) + 1))
    tripPlan.value.days.splice(dayIndex + 1, 0, source)
    _reindexDays()
    autoRecalculateBudget()
    message.success('已复制当天行程')
  }

  function updateDayInfo(dayIndex: number, field: string, value: any) {
    if (!tripPlan.value) return
    pushSnapshot()
    const day = tripPlan.value.days[dayIndex]
    ;(day as any)[field] = value
    isDirty.value = true
    autoRecalculateBudget()
  }

  /** 重新编排 day_index */
  function _reindexDays() {
    if (!tripPlan.value) return
    tripPlan.value.days.forEach((d, i) => {
      d.day_index = i
    })
  }

  // ---- Attraction 操作 ----

  function addAttraction(dayIndex: number, afterIndex?: number) {
    if (!tripPlan.value) return
    pushSnapshot()
    const day = tripPlan.value.days[dayIndex]
    const attr = createEmptyAttraction()
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : day.attractions.length
    day.attractions.splice(insertAt, 0, attr)
    autoRecalculateBudget()
    message.success('已添加景点')
  }

  function updateAttraction(dayIndex: number, attrIndex: number, field: string, value: any) {
    if (!tripPlan.value) return
    // 字段修改不入快照（太频繁），只在批量操作后入栈
    const day = tripPlan.value.days[dayIndex]
    const attr = day.attractions[attrIndex]
    if (!attr) return
    ;(attr as any)[field] = value
    isDirty.value = true
    autoRecalculateBudget()
  }

  function deleteAttraction(dayIndex: number, attrIndex: number) {
    if (!tripPlan.value) return
    const day = tripPlan.value.days[dayIndex]
    if (day.attractions.length <= 1) {
      message.warning('每天至少保留一个景点')
      return
    }
    pushSnapshot()
    day.attractions.splice(attrIndex, 1)
    autoRecalculateBudget()
    message.success('景点已删除')
  }

  function moveAttraction(dayIndex: number, fromIndex: number, toIndex: number) {
    if (!tripPlan.value) return
    if (fromIndex === toIndex) return
    pushSnapshot()
    const day = tripPlan.value.days[dayIndex]
    const [moved] = day.attractions.splice(fromIndex, 1)
    day.attractions.splice(toIndex, 0, moved)
  }

  function moveAttractionToDay(fromDay: number, fromIndex: number, toDay: number, toIndex?: number) {
    if (!tripPlan.value) return
    pushSnapshot()
    const srcDay = tripPlan.value.days[fromDay]
    const dstDay = tripPlan.value.days[toDay]
    const [moved] = srcDay.attractions.splice(fromIndex, 1)
    const insertAt = toIndex !== undefined ? toIndex : dstDay.attractions.length
    dstDay.attractions.splice(insertAt, 0, moved)
    autoRecalculateBudget()
    message.success(`已将景点移至第${toDay + 1}天`)
  }

  // ---- Hotel 操作 ----

  function updateHotel(dayIndex: number, field: string, value: any) {
    if (!tripPlan.value) return
    const day = tripPlan.value.days[dayIndex]
    if (!day.hotel) {
      pushSnapshot()
      day.hotel = createEmptyHotel()
    }
    ;(day.hotel as any)[field] = value
    isDirty.value = true
    autoRecalculateBudget()
  }

  function replaceHotel(dayIndex: number, newHotel: Hotel) {
    if (!tripPlan.value) return
    pushSnapshot()
    tripPlan.value.days[dayIndex].hotel = newHotel
    autoRecalculateBudget()
    message.success('酒店已替换')
  }

  // ---- Meal 操作 ----

  function addMeal(dayIndex: number, type: Meal['type'] = 'lunch') {
    if (!tripPlan.value) return
    pushSnapshot()
    tripPlan.value.days[dayIndex].meals.push(createEmptyMeal(type))
    autoRecalculateBudget()
  }

  function updateMeal(dayIndex: number, mealIndex: number, field: string, value: any) {
    if (!tripPlan.value) return
    const meal = tripPlan.value.days[dayIndex].meals[mealIndex]
    if (!meal) return
    ;(meal as any)[field] = value
    isDirty.value = true
    autoRecalculateBudget()
  }

  function deleteMeal(dayIndex: number, mealIndex: number) {
    if (!tripPlan.value) return
    const meals = tripPlan.value.days[dayIndex].meals
    if (meals.length <= 1) {
      message.warning('每天至少保留一餐')
      return
    }
    pushSnapshot()
    meals.splice(mealIndex, 1)
    autoRecalculateBudget()
  }

  // ---- Transport 操作 ----

  function updateTransport(transportIndex: number, field: string, value: any) {
    if (!tripPlan.value) return
    const t = tripPlan.value.inter_city_transport[transportIndex]
    if (!t) return
    ;(t as any)[field] = value
    isDirty.value = true
    autoRecalculateBudget()
  }

  function addTransport(fromCity?: string, toCity?: string) {
    if (!tripPlan.value) return
    pushSnapshot()
    tripPlan.value.inter_city_transport.push(createEmptyTransport(fromCity, toCity))
    autoRecalculateBudget()
  }

  function deleteTransport(transportIndex: number) {
    if (!tripPlan.value) return
    pushSnapshot()
    tripPlan.value.inter_city_transport.splice(transportIndex, 1)
    autoRecalculateBudget()
  }

  // ---- 预算重算 ----

  /** 校验数值合法性 */
  function _safeNum(val: any): number {
    const n = Number(val)
    if (isNaN(n) || n < 0 || !isFinite(n)) return 0
    return Math.round(n)
  }

  function autoRecalculateBudget() {
    if (!tripPlan.value) return

    let totalAttr = 0
    let totalMeals = 0
    let totalHotels = 0
    let totalTransport = 0
    let totalInterCity = 0

    for (const day of tripPlan.value.days) {
      for (const attr of day.attractions) {
        totalAttr += _safeNum(attr.ticket_price)
      }
      for (const meal of day.meals) {
        totalMeals += _safeNum(meal.estimated_cost)
      }
      if (day.hotel) {
        totalHotels += _safeNum(day.hotel.estimated_cost)
      }
      // 城内交通按天估算（默认50元/天）
      totalTransport += 50
    }

    for (const t of tripPlan.value.inter_city_transport) {
      totalInterCity += _safeNum(t.estimated_cost)
    }

    const budget: Budget = {
      total_attractions: totalAttr,
      total_meals: totalMeals,
      total_hotels: totalHotels,
      total_transportation: totalTransport,
      total_inter_city_transport: totalInterCity,
      total: totalAttr + totalMeals + totalHotels + totalTransport + totalInterCity,
    }

    tripPlan.value.budget = budget
  }

  // ---- localStorage 草稿 ----

  /** 检查是否有未完成草稿 */
  function checkDraft(): { exists: boolean; date: string } {
    if (!tripPlan.value) return { exists: false, date: '' }
    const key = getDraftKey(tripPlan.value)
    const raw = localStorage.getItem(key)
    if (!raw) return { exists: false, date: '' }
    try {
      const draft = JSON.parse(raw)
      if (draft._version !== SCHEMA_VERSION) {
        draftExists.value = true
        draftDate.value = draft._savedAt || ''
        return { exists: true, date: draft._savedAt || '' }
      }
      draftExists.value = true
      draftDate.value = draft._savedAt || ''
      return { exists: true, date: draft._savedAt || '' }
    } catch {
      return { exists: false, date: '' }
    }
  }

  /** 恢复草稿 */
  function restoreDraft(): boolean {
    if (!tripPlan.value) return false
    const key = getDraftKey(tripPlan.value)
    const raw = localStorage.getItem(key)
    if (!raw) return false
    try {
      const draft = JSON.parse(raw)
      if (draft._version !== SCHEMA_VERSION) {
        message.warning('草稿版本不兼容，已自动清除')
        localStorage.removeItem(key)
        return false
      }
      // 恢复数据（保留 _savedAt 等元信息不写入 tripPlan）
      const { _version, _savedAt, ...data } = draft
      Object.assign(tripPlan.value, data)
      message.success('已恢复未完成的编辑')
      return true
    } catch {
      message.error('草稿数据损坏，已清除')
      localStorage.removeItem(key)
      return false
    }
  }

  /** 清除草稿 */
  function clearDraft() {
    if (!tripPlan.value) return
    const key = getDraftKey(tripPlan.value)
    localStorage.removeItem(key)
    draftExists.value = false
    draftDate.value = ''
  }

  /** 防抖保存草稿 */
  function _debouncedSaveDraft() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      _saveDraftNow()
    }, DEBOUNCE_MS)
  }

  function _saveDraftNow() {
    if (!tripPlan.value) return
    const key = getDraftKey(tripPlan.value)
    const data = {
      ...deepClone(tripPlan.value),
      _version: SCHEMA_VERSION,
      _savedAt: new Date().toISOString(),
    }
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      console.warn('保存草稿失败（可能存储空间不足）:', e)
    }
  }

  // ---- 编辑模式 ----

  function enterEditMode() {
    if (!tripPlan.value) return
    pushSnapshot()
    editMode.value = true
    message.info('进入编辑模式')
  }

  function saveChanges() {
    if (!tripPlan.value) return
    _saveDraftNow()
    editMode.value = false
    isDirty.value = false
    undoStack.value = []
    redoStack.value = []
    sessionStorage.setItem('tripPlan', JSON.stringify(tripPlan.value))
    message.success('修改已保存')
    // 返回 true 表示需要刷新地图
    return true
  }

  function cancelEdit() {
    if (!tripPlan.value || undoStack.value.length === 0) {
      editMode.value = false
      return
    }
    // 恢复到第一个快照（进入编辑前的状态）
    const firstSnapshot = JSON.parse(undoStack.value[0])
    Object.assign(tripPlan.value, firstSnapshot)
    editMode.value = false
    isDirty.value = false
    undoStack.value = []
    redoStack.value = []
    message.info('已取消编辑')
    return true // 需要刷新地图
  }

  // ---- 监听 dirty 变化，触发防抖草稿 ----
  watch(isDirty, (val) => {
    if (val && tripPlan.value) {
      _debouncedSaveDraft()
    }
  })

  return {
    // 状态
    editMode,
    isDirty,
    viewMode,
    canUndo,
    canRedo,
    draftExists,
    draftDate,

    // 快照
    pushSnapshot,
    undo,
    redo,

    // Day
    addDay,
    deleteDay,
    duplicateDay,
    updateDayInfo,

    // Attraction
    addAttraction,
    updateAttraction,
    deleteAttraction,
    moveAttraction,
    moveAttractionToDay,

    // Hotel
    updateHotel,
    replaceHotel,

    // Meal
    addMeal,
    updateMeal,
    deleteMeal,

    // Transport
    updateTransport,
    addTransport,
    deleteTransport,

    // Budget
    autoRecalculateBudget,

    // Draft
    checkDraft,
    restoreDraft,
    clearDraft,

    // Mode
    enterEditMode,
    saveChanges,
    cancelEdit,
  }
}
