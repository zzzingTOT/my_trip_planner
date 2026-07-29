<template>
  <div class="home-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="icon-wrapper">
        <span class="icon">✈️</span>
      </div>
      <h1 class="page-title">智能旅行助手</h1>
      <p class="page-subtitle">基于AI的个性化旅行规划,让每一次出行都完美无忧</p>
    </div>

    <a-card class="form-card" :bordered="false">
      <a-form
        :model="formData"
        layout="vertical"
        @finish="handleSubmit"
      >
        <!-- 第一步:出发地与目的地 -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">📍</span>
            <span class="section-title">出发地与目的地</span>
          </div>

          <a-row :gutter="24">
            <!-- 出发城市 - 带自动补全 -->
            <a-col :span="6">
              <a-form-item name="departure_city" :rules="[{ required: true, message: '请输入出发城市' }]">
                <template #label>
                  <span class="form-label">出发城市</span>
                </template>
                <a-auto-complete
                  v-model:value="formData.departure_city"
                  :options="departureCityOptions"
                  placeholder="例如: 上海"
                  size="large"
                  class="custom-input"
                  @search="handleDepartureCitySearch"
                  :filter-option="false"
                >
                  <template #prefix>
                    <span style="color: #ff6b6b;">🏠</span>
                  </template>
                  <template #option="{ value }">
                    <div class="city-option">
                      <span>{{ value }}</span>
                    </div>
                  </template>
                </a-auto-complete>
              </a-form-item>
            </a-col>

            <!-- 目的地城市 - 多选标签模式 + 自动补全 -->
            <a-col :span="8">
              <a-form-item name="cities" :rules="[{ required: true, message: '请至少添加一个目的地城市', type: 'array', min: 1 }]">
                <template #label>
                  <span class="form-label">目的地城市（可多选）</span>
                </template>
                <a-select
                  v-model:value="formData.cities"
                  mode="tags"
                  size="large"
                  class="custom-select"
                  placeholder="输入城市名后按回车添加"
                  :max-tag-count="5"
                  :filter-option="false"
                  :options="destinationCityOptions"
                  @search="handleDestinationCitySearch"
                  @change="handleCitiesChange"
                >
                </a-select>
                <div v-if="formData.cities.length > 0" class="cities-hint">
                  📍 {{ formData.cities.join(' → ') }}
                </div>
              </a-form-item>
            </a-col>

            <a-col :span="5">
              <a-form-item name="start_date" :rules="[{ required: true, message: '请选择开始日期' }]">
                <template #label>
                  <span class="form-label">开始日期</span>
                </template>
                <a-date-picker
                  v-model:value="formData.start_date"
                  style="width: 100%"
                  size="large"
                  class="custom-input"
                  placeholder="选择日期"
                />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item name="end_date" :rules="[{ required: true, message: '请选择结束日期' }]">
                <template #label>
                  <span class="form-label">结束日期</span>
                </template>
                <a-date-picker
                  v-model:value="formData.end_date"
                  style="width: 100%"
                  size="large"
                  class="custom-input"
                  placeholder="选择日期"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 旅行天数显示 -->
          <a-row>
            <a-col :span="4">
              <div class="days-display">
                <span class="days-label">旅行天数</span>
                <span class="days-value">{{ formData.travel_days }}</span>
                <span class="days-unit">天</span>
              </div>
            </a-col>
          </a-row>
        </div>

        <!-- 第二步:偏好设置 -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">⚙️</span>
            <span class="section-title">偏好设置</span>
          </div>

          <a-row :gutter="24">
            <a-col :span="8">
              <a-form-item name="transportation">
                <template #label>
                  <span class="form-label">市内交通方式</span>
                </template>
                <a-select v-model:value="formData.transportation" size="large" class="custom-select">
                  <a-select-option value="公共交通">🚇 公共交通</a-select-option>
                  <a-select-option value="自驾">🚗 自驾</a-select-option>
                  <a-select-option value="步行">🚶 步行</a-select-option>
                  <a-select-option value="混合">🔀 混合</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item name="accommodation">
                <template #label>
                  <span class="form-label">住宿偏好</span>
                </template>
                <a-select v-model:value="formData.accommodation" size="large" class="custom-select">
                  <a-select-option value="经济型酒店">💰 经济型酒店</a-select-option>
                  <a-select-option value="舒适型酒店">🏨 舒适型酒店</a-select-option>
                  <a-select-option value="豪华酒店">⭐ 豪华酒店</a-select-option>
                  <a-select-option value="民宿">🏡 民宿</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item name="preferences">
                <template #label>
                  <span class="form-label">旅行偏好</span>
                </template>
                <div class="preference-tags">
                  <a-checkbox-group v-model:value="formData.preferences" class="custom-checkbox-group">
                    <a-checkbox value="历史文化" class="preference-tag">🏛️ 历史文化</a-checkbox>
                    <a-checkbox value="自然风光" class="preference-tag">🏞️ 自然风光</a-checkbox>
                    <a-checkbox value="美食" class="preference-tag">🍜 美食</a-checkbox>
                    <a-checkbox value="购物" class="preference-tag">🛍️ 购物</a-checkbox>
                    <a-checkbox value="艺术" class="preference-tag">🎨 艺术</a-checkbox>
                    <a-checkbox value="休闲" class="preference-tag">☕ 休闲</a-checkbox>
                  </a-checkbox-group>
                </div>
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- 第三步:额外要求 -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">💬</span>
            <span class="section-title">额外要求</span>
          </div>

          <a-form-item name="free_text_input">
            <a-textarea
              v-model:value="formData.free_text_input"
              placeholder="请输入您的额外要求,例如:想去看升旗、需要无障碍设施、对海鲜过敏等..."
              :rows="3"
              size="large"
              class="custom-textarea"
            />
          </a-form-item>
        </div>

        <!-- 第四步:参考攻略（可选） -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">📋</span>
            <span class="section-title">参考攻略（可选）</span>
            <a-tag color="purple" style="margin-left: 8px;">新功能</a-tag>
          </div>
          <p class="section-desc">
            粘贴小红书/马蜂窝等平台上的旅行攻略文本，AI 将自动提取景点、时长、避坑提示等信息。
            支持同时粘贴多篇攻略，系统会自动融合去重。
          </p>

          <!-- 攻略输入区（未提取时显示） -->
          <div v-if="!showSkeletonPreview">
            <div class="guide-inputs">
              <div
                v-for="(guide, index) in guideTexts"
                :key="index"
                class="guide-input-row"
              >
                <div class="guide-input-header">
                  <span class="guide-input-label">📄 攻略 #{{ index + 1 }}</span>
                  <a-button
                    v-if="guideTexts.length > 1"
                    size="small"
                    danger
                    type="text"
                    @click="removeGuide(index)"
                  >
                    移除
                  </a-button>
                </div>
                <a-textarea
                  v-model:value="guideTexts[index]"
                  :placeholder="index === 0 ? '在此粘贴攻略文本，例如：\nDay1：天安门→故宫→景山公园，晚上住鼓楼附近\nDay2：颐和园半天→圆明园→晚上去三里屯吃饭' : '粘贴第二篇攻略...'"
                  :rows="4"
                  size="large"
                  class="custom-textarea guide-textarea"
                />
              </div>
              <a-button type="dashed" block @click="addGuide" style="margin-top: 8px;">
                + 添加另一篇攻略
              </a-button>
            </div>

            <a-button
              type="primary"
              :loading="extracting"
              :disabled="!hasGuideContent"
              @click="handleExtractGuide"
              size="large"
              style="margin-top: 16px; width: 100%;"
              class="extract-button"
            >
              <template v-if="!extracting">
                🔍 提取攻略信息
              </template>
              <template v-else>
                正在提取攻略骨架...
              </template>
            </a-button>

            <div v-if="extractError" class="extract-error">
              ⚠️ {{ extractError }}
            </div>
          </div>

          <!-- 骨架预览区（提取完成后显示） -->
          <div v-if="showSkeletonPreview && skeletonData" class="skeleton-preview">
            <a-divider>📋 攻略提取结果预览</a-divider>

            <div class="skeleton-header">
              <a-space>
                <a-tag color="blue">识别 {{ skeletonData.total_days }} 天行程</a-tag>
                <a-tag v-if="skeletonData.source_count > 1" color="green">
                  融合 {{ skeletonData.source_count }} 篇攻略
                </a-tag>
                <a-tag v-for="tag in skeletonData.overall_tags" :key="tag" color="purple">
                  {{ tag }}
                </a-tag>
              </a-space>
              <a-button size="small" type="text" @click="resetGuideExtraction">
                重新提取
              </a-button>
            </div>

            <div
              v-if="skeletonData.overall_notes"
              class="skeleton-notes"
            >
              💡 {{ skeletonData.overall_notes }}
            </div>

            <!-- 每日景点列表（可勾选/删除） -->
            <div
              v-for="day in skeletonData.days"
              :key="day.day_index"
              class="skeleton-day"
            >
              <div class="skeleton-day-header">
                <strong>📅 第{{ day.day_index + 1 }}天</strong>
                <span class="skeleton-day-city" v-if="day.city">{{ day.city }}</span>
                <span class="skeleton-day-desc">{{ day.description }}</span>
              </div>
              <div class="skeleton-attractions">
                <div
                  v-for="(attr, attrIdx) in day.attractions"
                  :key="attrIdx"
                  class="skeleton-attr-row"
                  :class="{ 'attr-deselected': !attr.selected }"
                >
                  <a-checkbox
                    v-model:checked="attr.selected"
                    class="skeleton-checkbox"
                  />
                  <div class="skeleton-attr-info">
                    <span class="skeleton-attr-name">
                      {{ attr.name }}
                      <a-tag v-if="attr.source_guide_index !== undefined" size="small" color="blue" style="margin-left: 4px;">
                        攻略{{ attr.source_guide_index + 1 }}
                      </a-tag>
                    </span>
                    <span class="skeleton-attr-meta">
                      {{ attr.visit_duration }}分钟
                      <template v-if="attr.recommended_time"> · {{ attr.recommended_time }}</template>
                      <template v-if="attr.category"> · {{ attr.category }}</template>
                    </span>
                    <span v-if="attr.notes" class="skeleton-attr-notes">💡 {{ attr.notes }}</span>
                  </div>
                  <a-button
                    size="small"
                    type="text"
                    danger
                    @click="removeSkeletonAttr(day.day_index, attrIdx)"
                    class="skeleton-remove-btn"
                  >
                    ✕
                  </a-button>
                </div>
              </div>
              <!-- 餐饮建议 -->
              <div v-if="day.meal_suggestions.length > 0" class="skeleton-meals">
                🍽️ {{ day.meal_suggestions.join(' · ') }}
              </div>
            </div>

            <div class="skeleton-actions">
              <a-button @click="resetGuideExtraction" size="large">
                重新提取
              </a-button>
              <a-button
                type="primary"
                size="large"
                @click="handleConfirmSkeleton"
              >
                ✅ 确认骨架，生成完整行程
              </a-button>
            </div>
          </div>
        </div>

        <!-- 提交按钮（没有攻略时显示） -->
        <a-form-item v-if="!showSkeletonPreview">
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            size="large"
            block
            class="submit-button"
          >
            <template v-if="!loading">
              <span class="button-icon">🚀</span>
              <span>开始规划我的旅行</span>
            </template>
            <template v-else>
              <span>正在生成中...</span>
            </template>
          </a-button>
        </a-form-item>

        <!-- 骨架确认后生成中的状态 -->
        <a-form-item v-if="showSkeletonPreview && generating">
          <div class="loading-container">
            <a-progress
              :percent="loadingProgress"
              status="active"
              :stroke-color="{
                '0%': '#667eea',
                '100%': '#764ba2',
              }"
              :stroke-width="10"
            />
            <p class="loading-status">
              {{ loadingStatus }}
            </p>
          </div>
        </a-form-item>
      </a-form>
    </a-card>
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

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: -50px;
  animation-delay: 5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  bottom: -50px;
  left: 30%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
  }
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 50px;
  animation: fadeInDown 0.8s ease-out;
  position: relative;
  z-index: 1;
}

.icon-wrapper {
  margin-bottom: 20px;
}

.icon {
  font-size: 80px;
  display: inline-block;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.page-title {
  font-size: 56px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 16px;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

.page-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  font-weight: 300;
}

/* 表单卡片 */
.form-card {
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
  animation: fadeInUp 0.8s ease-out;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.98) !important;
}

/* 表单分区 */
.form-section {
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #667eea;
}

.section-icon {
  font-size: 24px;
  margin-right: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 表单标签 */
.form-label {
  font-size: 15px;
  font-weight: 500;
  color: #555;
}

/* 自定义输入框 */
.custom-input :deep(.ant-input),
.custom-input :deep(.ant-picker) {
  border-radius: 12px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.custom-input :deep(.ant-input:hover),
.custom-input :deep(.ant-picker:hover) {
  border-color: #667eea;
}

.custom-input :deep(.ant-input:focus),
.custom-input :deep(.ant-picker-focused) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 自定义选择框 */
.custom-select :deep(.ant-select-selector) {
  border-radius: 12px !important;
  border: 2px solid #e8e8e8 !important;
  transition: all 0.3s ease;
}

.custom-select:hover :deep(.ant-select-selector) {
  border-color: #667eea !important;
}

.custom-select :deep(.ant-select-focused .ant-select-selector) {
  border-color: #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

/* 多城市提示文字 */
.cities-hint {
  margin-top: 6px;
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}

/* 城市自动补全下拉选项 */
.city-option {
  padding: 4px 0;
  font-size: 14px;
}

/* 天数显示 */
.days-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}
.days-display .days-label {
  font-size: 13px;
  opacity: 0.9;
}
.days-display .days-value {
  font-size: 28px;
  font-weight: 700;
}
.days-display .days-unit {
  font-size: 14px;
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
  padding: 8px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 20px;
  transition: all 0.3s ease;
  background: white;
  font-size: 14px;
}

.preference-tag :deep(.ant-checkbox-wrapper:hover) {
  border-color: #667eea;
  background: #f5f7ff;
}

.preference-tag :deep(.ant-checkbox-wrapper-checked) {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 自定义文本域 */
.custom-textarea :deep(.ant-input) {
  border-radius: 12px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.custom-textarea :deep(.ant-input:hover) {
  border-color: #667eea;
}

.custom-textarea :deep(.ant-input:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 提交按钮 */
.submit-button {
  height: 56px;
  border-radius: 28px;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.submit-button:active {
  transform: translateY(0);
}

.button-icon {
  margin-right: 8px;
  font-size: 20px;
}

/* 加载容器 */
.loading-container {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 16px;
  border: 2px dashed #667eea;
}

.loading-status {
  margin-top: 16px;
  color: #667eea;
  font-size: 18px;
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