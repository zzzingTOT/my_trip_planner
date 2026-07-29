<template>
  <div class="day-editor-header">
    <a-row :gutter="12" align="middle">
      <!-- 日期 -->
      <a-col :span="5">
        <a-form-item label="日期" style="margin-bottom: 0;">
          <a-date-picker
            :value="dayjs(day.date)"
            @update:value="(v: any) => $emit('update:field', 'date', v?.format('YYYY-MM-DD') ?? '')"
            size="small"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </a-form-item>
      </a-col>

      <!-- 城市 -->
      <a-col :span="4">
        <a-form-item label="城市" style="margin-bottom: 0;">
          <a-input
            :value="day.city"
            @update:value="(v: string) => $emit('update:field', 'city', v)"
            size="small"
            placeholder="城市"
          />
        </a-form-item>
      </a-col>

      <!-- 交通 -->
      <a-col :span="5">
        <a-form-item label="交通" style="margin-bottom: 0;">
          <a-select
            :value="day.transportation"
            @update:value="(v: string) => $emit('update:field', 'transportation', v)"
            size="small"
          >
            <a-select-option value="公共交通">🚇 公共交通</a-select-option>
            <a-select-option value="自驾">🚗 自驾</a-select-option>
            <a-select-option value="步行">🚶 步行</a-select-option>
            <a-select-option value="混合">🔀 混合</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>

      <!-- 住宿 -->
      <a-col :span="5">
        <a-form-item label="住宿" style="margin-bottom: 0;">
          <a-select
            :value="day.accommodation"
            @update:value="(v: string) => $emit('update:field', 'accommodation', v)"
            size="small"
          >
            <a-select-option value="经济型酒店">💰 经济型</a-select-option>
            <a-select-option value="舒适型酒店">🏨 舒适型</a-select-option>
            <a-select-option value="豪华酒店">⭐ 豪华型</a-select-option>
            <a-select-option value="民宿">🏡 民宿</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>

      <!-- 天级操作 -->
      <a-col :span="5" style="text-align: right;">
        <a-space size="small" v-if="!readonly">
          <a-button size="small" @click="$emit('duplicate')" title="复制本天">📋</a-button>
          <a-button size="small" @click="$emit('addDayAfter')" title="在后面添加一天">+天</a-button>
          <a-popconfirm
            title="确定删除这一整天？"
            @confirm="$emit('deleteDay')"
            ok-text="删除"
            cancel-text="取消"
          >
            <a-button size="small" danger :disabled="!canDeleteDay">🗑️天</a-button>
          </a-popconfirm>
        </a-space>
      </a-col>
    </a-row>

    <!-- 行程概述 -->
    <a-form-item label="概述" style="margin-top: 8px; margin-bottom: 0;">
      <a-textarea
        :value="day.description"
        @update:value="(v: string) => $emit('update:field', 'description', v)"
        :rows="1"
        size="small"
        placeholder="本日行程概述"
      />
    </a-form-item>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { DayPlan } from '@/types'

defineProps<{
  day: DayPlan
  canDeleteDay: boolean
  readonly?: boolean
}>()

defineEmits<{
  'update:field': [field: string, value: any]
  'duplicate': []
  'addDayAfter': []
  'deleteDay': []
}>()
</script>

<style scoped>
.day-editor-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  margin-bottom: 12px;
}
</style>
