<template>
  <div class="editable-meal-list">
    <div class="meal-header">
      <span>🍽️ 餐饮安排</span>
      <a-button size="small" type="dashed" @click="$emit('addMeal')">+ 添加餐食</a-button>
    </div>
    <div class="meal-items">
      <div
        v-for="(meal, idx) in meals"
        :key="idx"
        class="meal-row"
      >
        <!-- 餐食类型标签 -->
        <a-select
          :value="meal.type"
          @update:value="(v: string) => $emit('updateMeal', idx, 'type', v)"
          size="small"
          style="width: 80px; flex-shrink: 0;"
        >
          <a-select-option value="breakfast">🥐 早餐</a-select-option>
          <a-select-option value="lunch">🍱 午餐</a-select-option>
          <a-select-option value="dinner">🍲 晚餐</a-select-option>
          <a-select-option value="snack">🍢 小吃</a-select-option>
        </a-select>

        <!-- 餐食名称 -->
        <a-input
          :value="meal.name"
          @update:value="(v: string) => $emit('updateMeal', idx, 'name', v)"
          size="small"
          placeholder="餐厅/菜品名称"
          style="flex: 1;"
        />

        <!-- 费用 -->
        <a-input-number
          :value="meal.estimated_cost ?? 0"
          @update:value="(v: number | null) => $emit('updateMeal', idx, 'estimated_cost', v ?? 0)"
          size="small"
          :min="0"
          :step="10"
          placeholder="费用"
          style="width: 90px;"
          addon-after="元"
        />

        <!-- 描述 -->
        <a-input
          :value="meal.description ?? ''"
          @update:value="(v: string) => $emit('updateMeal', idx, 'description', v)"
          size="small"
          placeholder="描述(可选)"
          style="width: 140px;"
        />

        <!-- 删除 -->
        <a-button
          size="small"
          danger
          type="text"
          @click="$emit('deleteMeal', idx)"
          :disabled="meals.length <= 1"
        >
          ✕
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Meal } from '@/types'

defineProps<{
  meals: Meal[]
}>()

defineEmits<{
  'updateMeal': [idx: number, field: string, value: any]
  'deleteMeal': [idx: number]
  'addMeal': []
}>()
</script>

<style scoped>
.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
}
.meal-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.meal-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
