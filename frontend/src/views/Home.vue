<template>
  <div class="home-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 页面标题 — 紧凑品牌区 -->
    <div class="page-header">
      <div class="brand-row">
        <span class="brand-icon">✈️</span>
        <h1 class="page-title">Trip Planner</h1>
      </div>
      <p class="page-subtitle">AI驱动的智能旅行助手 · 输入目的地，即刻生成专属行程</p>
    </div>

    <!-- ====== 核心信息卡片（必填项） ====== -->
    <div class="core-card">
      <a-form
        :model="formData"
        layout="vertical"
        @finish="handleSubmit"
      >
        <a-row :gutter="20" align="bottom">
          <!-- 出发城市 -->
          <a-col :xs="24" :sm="6">
            <a-form-item name="departure_city" :rules="[{ required: true, message: '请输入出发城市' }]" style="margin-bottom: 0;">
              <template #label>
                <span class="form-label">出发城市</span>
              </template>
              <a-auto-complete
                v-model:value="formData.departure_city"
                :options="departureCityOptions"
                placeholder="上海"
                size="large"
                class="core-input"
                @search="handleDepartureCitySearch"
                :filter-option="false"
              />
            </a-form-item>
          </a-col>

          <!-- 目的地城市 -->
          <a-col :xs="24" :sm="8">
            <a-form-item name="cities" :rules="[{ required: true, message: '请至少添加一个目的地', type: 'array', min: 1 }]" style="margin-bottom: 0;">
              <template #label>
                <span class="form-label">目的地</span>
              </template>
              <a-select
                v-model:value="formData.cities"
                mode="tags"
                size="large"
                class="core-select"
                placeholder="输入城市名后按回车"
                :max-tag-count="4"
                :filter-option="false"
                :options="destinationCityOptions"
                @search="handleDestinationCitySearch"
                @change="handleCitiesChange"
              />
            </a-form-item>
          </a-col>

          <!-- 开始日期 -->
          <a-col :xs="12" :sm="4">
            <a-form-item name="start_date" :rules="[{ required: true, message: '请选择' }]" style="margin-bottom: 0;">
              <template #label>
                <span class="form-label">出发</span>
              </template>
              <a-date-picker
                v-model:value="formData.start_date"
                size="large"
                class="core-date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>

          <!-- 结束日期 -->
          <a-col :xs="12" :sm="4">
            <a-form-item name="end_date" :rules="[{ required: true, message: '请选择' }]" style="margin-bottom: 0;">
              <template #label>
                <span class="form-label">返回</span>
              </template>
              <a-date-picker
                v-model:value="formData.end_date"
                size="large"
                class="core-date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>

          <!-- 天数 + 提交按钮 -->
          <a-col :xs="24" :sm="2">
            <div class="core-submit-wrap">
              <div class="days-badge" v-if="formData.travel_days > 0">
                <span class="days-num">{{ formData.travel_days }}</span>
                <span class="days-unit">天</span>
              </div>
              <a-button
                type="primary"
                html-type="submit"
                :loading="loading"
                size="large"
                block
                class="core-submit-btn"
                :disabled="!canSubmit"
              >
                <template v-if="!loading">🚀 开始规划</template>
                <template v-else>规划中...</template>
              </a-button>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </div>

    <!-- 加载进度 -->
    <div v-if="loading" class="progress-bar">
      <a-progress
        :percent="loadingProgress"
        status="active"
        :stroke-color="{ from: '#5b4cc4', to: '#7b6fd4' }"
        :stroke-width="8"
      />
      <p class="progress-text">{{ loadingStatus }}</p>
    </div>

    <!-- ====== 高级选项（可折叠） ====== -->
    <div class="advanced-section">
      <div class="advanced-toggle" @click="showAdvanced = !showAdvanced">
        <span>⚙️ 偏好与高级设置</span>
        <span class="toggle-arrow" :class="{ open: showAdvanced }">▼</span>
      </div>

      <div v-show="showAdvanced" class="advanced-panel">
        <!-- 偏好设置 -->
        <div class="advanced-card">
          <div class="card-label">旅行偏好</div>
          <div class="preference-chips">
            <div
              v-for="pref in availablePreferences"
              :key="pref.key"
              class="pref-chip"
              :class="{ active: formData.preferences.includes(pref.key) }"
              @click="togglePreference(pref.key)"
            >
              {{ pref.icon }} {{ pref.label }}
            </div>
          </div>
        </div>

        <!-- 交通 + 住宿 -->
        <a-row :gutter="16" style="margin-top: 12px;">
          <a-col :span="12">
            <div class="advanced-card">
              <div class="card-label">市内交通</div>
              <a-select v-model:value="formData.transportation" size="middle" class="core-select" style="width: 100%;">
                <a-select-option value="公共交通">🚇 公共交通</a-select-option>
                <a-select-option value="自驾">🚗 自驾</a-select-option>
                <a-select-option value="步行">🚶 步行</a-select-option>
                <a-select-option value="混合">🔀 混合</a-select-option>
              </a-select>
            </div>
          </a-col>
          <a-col :span="12">
            <div class="advanced-card">
              <div class="card-label">住宿偏好</div>
              <a-select v-model:value="formData.accommodation" size="middle" class="core-select" style="width: 100%;">
                <a-select-option value="经济型酒店">💰 经济型</a-select-option>
                <a-select-option value="舒适型酒店">🏨 舒适型</a-select-option>
                <a-select-option value="豪华酒店">⭐ 豪华型</a-select-option>
                <a-select-option value="民宿">🏡 民宿</a-select-option>
              </a-select>
            </div>
          </a-col>
        </a-row>

        <!-- 额外要求 -->
        <div class="advanced-card" style="margin-top: 12px;">
          <div class="card-label">额外要求</div>
          <a-textarea
            v-model:value="formData.free_text_input"
            placeholder="例如：想看升旗、对海鲜过敏、需要无障碍设施..."
            :rows="2"
            size="middle"
            class="custom-textarea"
          />
        </div>

        <!-- ====== 参考攻略（可折叠子区域） ====== -->
        <div class="advanced-card guide-card" style="margin-top: 12px;">
          <div class="guide-header" @click="showGuideSection = !showGuideSection">
            <div class="card-label" style="margin-bottom: 0;">📋 参考攻略（可选）</div>
            <a-tag color="purple" size="small">Beta</a-tag>
            <span class="toggle-arrow" :class="{ open: showGuideSection }" style="font-size: 12px;">▼</span>
          </div>
          <p class="guide-desc" v-show="showGuideSection">粘贴小红书/马蜂窝等攻略文本，AI 自动提取景点与行程建议</p>

          <div v-show="showGuideSection">
            <div v-if="!showSkeletonPreview">
              <div class="guide-inputs">
                <div v-for="(guide, index) in guideTexts" :key="index" class="guide-input-row">
                  <div class="guide-input-header">
                    <span class="guide-input-label">攻略 #{{ index + 1 }}</span>
                    <a-button v-if="guideTexts.length > 1" size="small" danger type="text" @click="removeGuide(index)">移除</a-button>
                  </div>
                  <a-textarea
                    v-model:value="guideTexts[index]"
                    :placeholder="index === 0 ? '粘贴攻略文本，如：Day1 天安门→故宫→景山，住鼓楼附近' : '粘贴第二篇攻略...'"
                    :rows="3"
                    size="small"
                    class="guide-textarea"
                  />
                </div>
                <a-button size="small" type="dashed" block @click="addGuide" style="margin-top: 6px;">+ 添加另一篇攻略</a-button>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <a-button
                  size="small"
                  :loading="extracting"
                  :disabled="!hasGuideContent"
                  @click="handleExtractGuide"
                >
                  🔍 提取攻略信息
                </a-button>
                <span v-if="extractError" class="extract-error-inline">⚠️ {{ extractError }}</span>
              </div>
            </div>

            <!-- 骨架预览 -->
            <div v-if="showSkeletonPreview && skeletonData" class="skeleton-preview">
              <div class="skeleton-header">
                <a-space size="small" wrap>
                  <a-tag color="blue">{{ skeletonData.total_days }}天</a-tag>
                  <a-tag v-if="skeletonData.source_count > 1" color="green">{{ skeletonData.source_count }}篇融合</a-tag>
                  <a-tag v-for="tag in skeletonData.overall_tags" :key="tag" color="purple" size="small">{{ tag }}</a-tag>
                </a-space>
                <a-button size="small" type="text" @click="resetGuideExtraction">重新提取</a-button>
              </div>
              <div v-if="skeletonData.overall_notes" class="skeleton-notes">💡 {{ skeletonData.overall_notes }}</div>
              <div v-for="day in skeletonData.days" :key="day.day_index" class="skeleton-day">
                <div class="skeleton-day-header">
                  <strong>Day {{ day.day_index + 1 }}</strong>
                  <span class="skeleton-day-city" v-if="day.city">{{ day.city }}</span>
                </div>
                <div class="skeleton-attractions">
                  <div v-for="(attr, attrIdx) in day.attractions" :key="attrIdx" class="skeleton-attr-row" :class="{ 'attr-deselected': !attr.selected }">
                    <a-checkbox v-model:checked="attr.selected" />
                    <div class="skeleton-attr-info">
                      <span class="skeleton-attr-name">
                        {{ attr.name }}
                        <a-tag v-if="attr.source_guide_index !== undefined" color="blue" size="small">攻略{{ attr.source_guide_index + 1 }}</a-tag>
                      </span>
                      <span class="skeleton-attr-meta">{{ attr.visit_duration }}min<template v-if="attr.recommended_time"> · {{ attr.recommended_time }}</template></span>
                      <span v-if="attr.notes" class="skeleton-attr-notes">💡 {{ attr.notes }}</span>
                    </div>
                    <a-button size="small" type="text" danger @click="removeSkeletonAttr(day.day_index, attrIdx)">✕</a-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 骨架生成中的状态 -->
    <div v-if="showSkeletonPreview && generating" class="progress-bar" style="margin-top: 16px;">
      <a-progress
        :percent="loadingProgress"
        status="active"
        :stroke-color="{ from: '#5b4cc4', to: '#7b6fd4' }"
        :stroke-width="8"
      />
      <p class="progress-text">{{ loadingStatus }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { generateTripPlan, extractGuide, planFromSkeleton } from '@/services/api'
import { searchCities } from '@/data/cities'
import type { TripFormData, GuideExtractionResult } from '@/types'
import type { Dayjs } from 'dayjs'

const router = useRouter()
const loading = ref(false)
const loadingProgress = ref(0)
const loadingStatus = ref('')

// 高级选项展开/折叠
const showAdvanced = ref(false)
const showGuideSection = ref(false)

// 攻略相关状态
const guideTexts = ref<string[]>([''])
const extracting = ref(false)
const generating = ref(false)
const extractError = ref('')
const showSkeletonPreview = ref(false)
const skeletonData = ref<GuideExtractionResult | null>(null)

// 出发城市自动补全选项
const departureCityOptions = ref<{ value: string; label: string }[]>([])
// 目的地城市自动补全选项
const destinationCityOptions = ref<{ value: string; label: string }[]>([])

// 是否可以提交（必填项校验 + 主按钮disabled）
const canSubmit = computed(() => {
  return formData.departure_city.trim().length > 0
    && formData.cities.length > 0
    && formData.start_date !== null
    && formData.end_date !== null
    && !loading.value
})

// 快捷偏好标签
const availablePreferences = [
  { key: '历史文化', icon: '🏛️', label: '历史文化' },
  { key: '自然风光', icon: '🏞️', label: '自然风光' },
  { key: '美食', icon: '🍜', label: '美食' },
  { key: '购物', icon: '🛍️', label: '购物' },
  { key: '艺术', icon: '🎨', label: '艺术' },
  { key: '休闲', icon: '☕', label: '休闲' },
]

function togglePreference(key: string) {
  const idx = formData.preferences.indexOf(key)
  if (idx >= 0) {
    formData.preferences.splice(idx, 1)
  } else {
    formData.preferences.push(key)
  }
}

const formData = reactive<TripFormData & { start_date: Dayjs | null; end_date: Dayjs | null }>({
  departure_city: '',       // 出发城市，必填
  cities: [],               // 目的地城市列表，至少一个
  start_date: null,
  end_date: null,
  travel_days: 1,
  transportation: '公共交通',
  accommodation: '经济型酒店',
  preferences: [],
  free_text_input: ''
})

// 出发城市搜索：用户每输入一个字，就从城市数据库里匹配
const handleDepartureCitySearch = (keyword: string) => {
  const matched = searchCities(keyword, 10)
  departureCityOptions.value = matched.map(name => ({
    value: name,
    label: name
  }))
}

// 目的地城市搜索：用于 a-select 的 tags 模式下拉选项
const handleDestinationCitySearch = (keyword: string) => {
  const matched = searchCities(keyword, 10)
  destinationCityOptions.value = matched.map(name => ({
    value: name,
    label: name
  }))
}

// 目的地城市变化时的回调
const handleCitiesChange = (cities: string[]) => {
  // 确保 cities 始终是字符串数组
  formData.cities = cities
}

// ============ 攻略相关 ============

const hasGuideContent = computed(() => {
  return guideTexts.value.some(t => t.trim().length > 20)
})

const addGuide = () => {
  if (guideTexts.value.length >= 5) {
    message.warning('最多同时粘贴5篇攻略')
    return
  }
  guideTexts.value.push('')
}

const removeGuide = (index: number) => {
  guideTexts.value.splice(index, 1)
  if (guideTexts.value.length === 0) {
    guideTexts.value.push('')
  }
}

const resetGuideExtraction = () => {
  showSkeletonPreview.value = false
  skeletonData.value = null
  extractError.value = ''
}

/**
 * 第一步：提取攻略骨架
 */
const handleExtractGuide = async () => {
  // 过滤掉空文本
  const validTexts = guideTexts.value.filter(t => t.trim().length > 10)

  if (validTexts.length === 0) {
    message.warning('请至少粘贴一篇攻略（不少于10个字）')
    return
  }

  extracting.value = true
  extractError.value = ''

  try {
    const response = await extractGuide({
      guide_texts: validTexts,
      cities: formData.cities,
      travel_days: formData.travel_days,
    })

    if (response.success && response.data) {
      skeletonData.value = response.data
      showSkeletonPreview.value = true
      message.success(response.message)
    } else {
      extractError.value = response.message || '提取失败，请检查攻略内容或重试'
      message.error(extractError.value)
    }
  } catch (error: any) {
    extractError.value = error.message || '提取失败，请稍后重试'
    message.error(extractError.value)
  } finally {
    extracting.value = false
  }
}

const removeSkeletonAttr = (dayIndex: number, attrIndex: number) => {
  if (!skeletonData.value) return
  const day = skeletonData.value.days.find(d => d.day_index === dayIndex)
  if (!day) return
  day.attractions.splice(attrIndex, 1)
}

/**
 * 第二步：确认骨架，生成完整行程
 */
const handleConfirmSkeleton = async () => {
  if (!skeletonData.value) return

  if (!formData.start_date || !formData.end_date) {
    message.error('请选择日期')
    return
  }

  generating.value = true
  loadingProgress.value = 0
  loadingStatus.value = '正在基于攻略骨架生成完整行程...'

  const progressInterval = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += 15
      if (loadingProgress.value <= 40) {
        loadingStatus.value = '🔍 正在补充景点详情...'
      } else if (loadingProgress.value <= 60) {
        loadingStatus.value = '🌤️ 正在查询天气...'
      } else if (loadingProgress.value <= 80) {
        loadingStatus.value = '🏨 正在匹配酒店...'
      } else {
        loadingStatus.value = '📋 正在生成完整行程...'
      }
    }
  }, 500)

  try {
    const requestData: TripFormData = {
      departure_city: formData.departure_city,
      cities: formData.cities,
      start_date: formData.start_date!.format('YYYY-MM-DD'),
      end_date: formData.end_date!.format('YYYY-MM-DD'),
      travel_days: formData.travel_days,
      transportation: formData.transportation,
      accommodation: formData.accommodation,
      preferences: formData.preferences,
      free_text_input: formData.free_text_input,
    }

    const response = await planFromSkeleton({
      skeleton: skeletonData.value,
      trip_params: requestData,
    })

    clearInterval(progressInterval)
    loadingProgress.value = 100
    loadingStatus.value = '✅ 完成!'

    if (response.success && response.data) {
      sessionStorage.setItem('tripPlan', JSON.stringify(response.data))
      message.success('行程生成成功！已融合攻略建议')
      setTimeout(() => {
        router.push('/result')
      }, 500)
    } else {
      message.error(response.message || '生成失败')
    }
  } catch (error: any) {
    clearInterval(progressInterval)
    message.error(error.message || '生成行程失败，请稍后重试')
  } finally {
    setTimeout(() => {
      generating.value = false
      loadingProgress.value = 0
      loadingStatus.value = ''
    }, 1000)
  }
}

// 监听日期变化,自动计算旅行天数
watch([() => formData.start_date, () => formData.end_date], ([start, end]) => {
  if (start && end) {
    const days = end.diff(start, 'day') + 1
    if (days > 0 && days <= 30) {
      formData.travel_days = days
    } else if (days > 30) {
      message.warning('旅行天数不能超过30天')
      formData.end_date = null
    } else {
      message.warning('结束日期不能早于开始日期')
      formData.end_date = null
    }
  }
})

const handleSubmit = async () => {
  if (!formData.start_date || !formData.end_date) {
    message.error('请选择日期')
    return
  }

  // P013-1 修复: 如果有已提取但未确认的骨架，自动走骨架驱动流程
  if (showSkeletonPreview.value && skeletonData.value) {
    // 检查用户是否至少勾选了一个景点
    const hasChecked = skeletonData.value.days.some(d =>
      d.attractions.some(a => a.selected)
    )
    if (hasChecked) {
      // 有骨架→走骨架驱动流程
      await handleConfirmSkeleton()
      return
    }
    // 骨架为空（用户取消全部勾选）→退化为标准流程
    message.info('未选择任何攻略景点，使用标准规划流程')
  }

  loading.value = true
  loadingProgress.value = 0
  loadingStatus.value = '正在初始化...'

  // 模拟进度更新
  const progressInterval = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += 10

      // 更新状态文本
      if (loadingProgress.value <= 30) {
        loadingStatus.value = '🔍 正在搜索景点...'
      } else if (loadingProgress.value <= 50) {
        loadingStatus.value = '🌤️ 正在查询天气...'
      } else if (loadingProgress.value <= 70) {
        loadingStatus.value = '🏨 正在推荐酒店...'
      } else {
        loadingStatus.value = '📋 正在生成行程计划...'
      }
    }
  }, 500)

  try {
    const requestData: TripFormData = {
      departure_city: formData.departure_city,       // 出发城市
      cities: formData.cities,                        // 目的地城市列表
      start_date: formData.start_date.format('YYYY-MM-DD'),
      end_date: formData.end_date.format('YYYY-MM-DD'),
      travel_days: formData.travel_days,
      transportation: formData.transportation,
      accommodation: formData.accommodation,
      preferences: formData.preferences,
      free_text_input: formData.free_text_input
    }

    const response = await generateTripPlan(requestData)

    clearInterval(progressInterval)
    loadingProgress.value = 100
    loadingStatus.value = '✅ 完成!'

    if (response.success && response.data) {
      // 保存到sessionStorage
      sessionStorage.setItem('tripPlan', JSON.stringify(response.data))

      message.success('旅行计划生成成功!')

      // 短暂延迟后跳转
      setTimeout(() => {
        router.push('/result')
      }, 500)
    } else {
      message.error(response.message || '生成失败')
    }
  } catch (error: any) {
    clearInterval(progressInterval)
    message.error(error.message || '生成旅行计划失败,请稍后重试')
  } finally {
    setTimeout(() => {
      loading.value = false
      loadingProgress.value = 0
      loadingStatus.value = ''
    }, 1000)
  }
}
</script>

/* ============ 新架构首页样式 ============ */

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #eef0f8 0%, var(--color-bg-page) 100%);
  padding: 40px 20px 60px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; opacity: 0.5; }
.circle { position: absolute; border-radius: 50%; background: rgba(91, 76, 196, 0.04); animation: float 25s infinite ease-in-out; }
.circle-1 { width: 400px; height: 400px; top: -150px; right: -150px; }
.circle-2 { width: 200px; height: 200px; bottom: 10%; left: -80px; animation-delay: 8s; }
.circle-3 { width: 120px; height: 120px; top: 40%; right: 15%; animation-delay: 16s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

/* 页面标题 — 紧凑品牌区 */
.page-header { text-align: center; margin-bottom: var(--space-xl); position: relative; z-index: 1; animation: fadeInDown 0.5s ease-out; }
.brand-row { display: flex; align-items: center; justify-content: center; gap: 10px; }
.brand-icon { font-size: 28px; }
.page-title { font-size: var(--font-heading-lg); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.5px; }
.page-subtitle { font-size: var(--font-body); color: var(--color-text-tertiary); margin: 6px 0 0; font-weight: 400; }

/* 核心信息卡片 */
.core-card {
  max-width: 860px;
  margin: 0 auto;
  background: var(--color-bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 28px 32px 20px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.5s ease-out;
}

.form-label {
  font-size: var(--font-caption);
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.core-input :deep(.ant-input),
.core-date :deep(.ant-input) {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.core-select :deep(.ant-select-selector) {
  border-radius: var(--radius-sm) !important;
  border: 1px solid var(--color-border) !important;
}

.core-submit-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.days-badge {
  padding: 2px 12px;
  background: var(--color-brand-gradient);
  color: white;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: var(--font-body);
}

.core-submit-btn {
  height: 44px;
  border-radius: var(--radius-md);
}
.core-submit-btn:disabled {
  opacity: 0.5;
}

/* 加载进度条 */
.progress-bar {
  max-width: 860px;
  margin: var(--space-md) auto 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.progress-text {
  margin-top: var(--space-sm);
  color: var(--color-brand);
  font-size: var(--font-small);
}

/* 高级选项 */
.advanced-section {
  max-width: 860px;
  margin: var(--space-md) auto 0;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease-out;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
  font-size: var(--font-small);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: box-shadow var(--transition-fast);
}

.advanced-toggle:hover {
  box-shadow: var(--shadow-sm);
}

.toggle-arrow {
  transition: transform var(--transition-fast);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.toggle-arrow.open {
  transform: rotate(180deg);
}

.advanced-panel {
  margin-top: var(--space-sm);
  animation: fadeInUp 0.3s ease-out;
}

.advanced-card {
  padding: var(--space-md);
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.card-label {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
  font-size: var(--font-small);
}

/* 偏好芯片 */
.preference-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pref-chip {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-small);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  background: var(--color-bg-surface);
}

.pref-chip:hover {
  border-color: var(--color-brand-light);
}

.pref-chip.active {
  background: var(--color-brand-gradient);
  color: white;
  border-color: transparent;
}

/* 攻略区域 */
.guide-card {
  background: var(--color-bg-hover);
}

.guide-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 6px;
}

.guide-desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0 0 10px;
}

.guide-input-row {
  margin-bottom: 8px;
}

.guide-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.guide-input-label {
  font-size: var(--font-caption);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.guide-textarea {
  font-size: var(--font-caption);
}

.extract-error-inline {
  font-size: var(--font-caption);
  color: var(--color-error);
}

/* 骨架预览（在高级面板内） */
.skeleton-preview {
  margin-top: 10px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.skeleton-notes {
  padding: 8px 10px;
  background: var(--color-info-bg);
  border-radius: var(--radius-sm);
  font-size: var(--font-caption);
  color: var(--color-info);
  margin-bottom: 8px;
}

.skeleton-day {
  margin-bottom: 8px;
  padding: 10px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.skeleton-day-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: var(--font-small);
}

.skeleton-day-city {
  font-size: var(--font-caption);
  color: var(--color-brand);
}

.skeleton-attractions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skeleton-attr-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  background: var(--color-bg-hover);
  border-radius: var(--radius-sm);
}

.skeleton-attr-row.attr-deselected {
  opacity: 0.4;
}

.skeleton-attr-info {
  flex: 1;
}

.skeleton-attr-name {
  font-size: var(--font-small);
  font-weight: 600;
}
.skeleton-attr-meta {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}
.skeleton-attr-notes {
  font-size: var(--font-caption);
  color: var(--color-warning);
}

/* 兼容旧级联样式（回退） */
.form-section, .section-header, .section-icon, .section-title,
.preference-tags, .custom-checkbox-group, .preference-tag,
.custom-input, .custom-select, .cities-hint, .city-option,
.custom-textarea, .submit-button, .button-icon, .loading-container,
.loading-status, .extract-button, .extract-error, .days-display {
  /* 保留但隐藏，新样式已覆盖 */
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 页面标题 — 压缩高度，去AI味 */
.page-header {
  text-align: center;
  margin-bottom: var(--space-xl);
  animation: fadeInDown 0.6s ease-out;
  position: relative;
  z-index: 1;
}

.icon-wrapper {
  margin-bottom: var(--space-md);
}

.icon {
  font-size: 44px;
  display: inline-block;
  filter: drop-shadow(0 4px 8px rgba(91, 76, 196, 0.2));
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.page-title {
  font-size: var(--font-heading-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: var(--font-body);
  color: var(--color-text-tertiary);
  margin: 0;
  font-weight: 400;
}

/* 表单卡片 — 去除全屏渐变，改为纯白单卡片 */
.form-card {
  max-width: 860px;
  margin: 0 auto;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  animation: fadeInUp 0.6s ease-out;
  position: relative;
  z-index: 1;
  background: var(--color-bg-surface) !important;
}

/* 表单分区 — 更精致的卡片式分区 */
.form-section {
  margin-bottom: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  transition: box-shadow var(--transition-fast);
}

.form-section:hover {
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid var(--color-brand);
}

.section-icon {
  font-size: 18px;
  margin-right: 8px;
}

.section-title {
  font-size: var(--font-heading-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 表单标签 */
.form-label {
  font-size: var(--font-small);
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* 自定义输入框 */
.custom-input :deep(.ant-input),
.custom-input :deep(.ant-picker) {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.custom-input :deep(.ant-input:hover),
.custom-input :deep(.ant-picker:hover) {
  border-color: var(--color-brand-light);
}

.custom-input :deep(.ant-input:focus),
.custom-input :deep(.ant-picker-focused) {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(91, 76, 196, 0.08);
}

/* 自定义选择框 */
.custom-select :deep(.ant-select-selector) {
  border-radius: var(--radius-sm) !important;
  border: 1px solid var(--color-border) !important;
  transition: border-color var(--transition-fast);
}

.custom-select:hover :deep(.ant-select-selector) {
  border-color: var(--color-brand-light) !important;
}

.custom-select :deep(.ant-select-focused .ant-select-selector) {
  border-color: var(--color-brand) !important;
  box-shadow: 0 0 0 3px rgba(91, 76, 196, 0.08) !important;
}

/* 多城市提示文字 */
.cities-hint {
  margin-top: 6px;
  font-size: var(--font-caption);
  color: var(--color-brand);
  font-weight: 500;
}

/* 城市自动补全下拉选项 */
.city-option {
  padding: 4px 0;
  font-size: var(--font-small);
}

/* 天数显示 */
.days-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 20px;
  background: var(--color-brand-gradient);
  border-radius: var(--radius-full);
  color: white;
}
.days-display .days-label {
  font-size: var(--font-caption);
  opacity: 0.9;
}
.days-display .days-value {
  font-size: 22px;
  font-weight: 700;
}
.days-display .days-unit {
  font-size: var(--font-caption);
}

/* 偏好标签 */
.preference-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.preference-tag :deep(.ant-checkbox-wrapper) {
  margin: 0 !important;
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  background: var(--color-bg-surface);
  font-size: var(--font-small);
  cursor: pointer;
}

.preference-tag :deep(.ant-checkbox-wrapper:hover) {
  border-color: var(--color-brand-light);
  background: var(--color-bg-hover);
}

.preference-tag :deep(.ant-checkbox-wrapper-checked) {
  border-color: var(--color-brand);
  background: var(--color-brand-gradient);
  color: white;
}

/* 自定义文本域 */
.custom-textarea :deep(.ant-input) {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.custom-textarea :deep(.ant-input:hover) {
  border-color: var(--color-brand-light);
}

.custom-textarea :deep(.ant-input:focus) {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(91, 76, 196, 0.08);
}

/* 提交按钮 */
.submit-button {
  height: 52px;
  border-radius: var(--radius-md);
  font-size: var(--font-body);
  font-weight: 600;
  background: var(--color-brand-gradient);
  border: none;
  box-shadow: var(--shadow-button);
  transition: all var(--transition-fast);
}

.submit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(91, 76, 196, 0.35);
}

.submit-button:active {
  transform: translateY(0);
}

.button-icon {
  margin-right: 8px;
  font-size: 18px;
}

/* 加载容器 */
.loading-container {
  text-align: center;
  padding: var(--space-lg);
  background: var(--color-bg-surface);
  border-radius: var(--radius-xl);
  border: 1px dashed var(--color-brand-light);
}

.loading-status {
  margin-top: var(--space-md);
  color: var(--color-brand);
  font-size: var(--font-body);
  font-weight: 500;
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============ 攻略相关样式 ============ */

.section-desc {
  color: #888;
  font-size: 13px;
  margin: -12px 0 16px 0;
  line-height: 1.5;
}

.guide-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-input-row {
  background: #fafafa;
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
}

.guide-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.guide-input-label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.guide-textarea {
  font-size: 13px;
  line-height: 1.6;
}

.extract-button {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%) !important;
  border: none !important;
  font-weight: 600;
}

.extract-error {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #ff4d4f;
  font-size: 14px;
}

/* 骨架预览 */
.skeleton-preview {
  animation: fadeInUp 0.4s ease-out;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.skeleton-notes {
  padding: 10px 14px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  color: #0050b3;
  font-size: 13px;
  margin-bottom: 16px;
}

.skeleton-day {
  margin-bottom: 16px;
  padding: 14px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
}

.skeleton-day-header {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.skeleton-day-city {
  background: #f5f0ff;
  color: #531dab;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.skeleton-day-desc {
  color: #888;
  font-size: 13px;
}

.skeleton-attractions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-attr-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s;
}

.skeleton-attr-row.attr-deselected {
  opacity: 0.45;
  background: #fafafa;
}

.skeleton-checkbox {
  margin-top: 2px;
}

.skeleton-attr-info {
  flex: 1;
  min-width: 0;
}

.skeleton-attr-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.skeleton-attr-meta {
  display: block;
  color: #999;
  font-size: 12px;
  margin-top: 2px;
}

.skeleton-attr-notes {
  display: block;
  color: #fa8c16;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.4;
}

.skeleton-remove-btn {
  flex-shrink: 0;
  margin-top: -2px;
}

.skeleton-meals {
  margin-top: 8px;
  padding: 6px 10px;
  background: #fffbe6;
  border-radius: 6px;
  font-size: 12px;
  color: #ad8b00;
}

.skeleton-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>