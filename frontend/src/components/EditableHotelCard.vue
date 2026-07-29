<template>
  <div class="editable-hotel-card">
    <a-card size="small" title="🏨 住宿推荐" class="hotel-card">
      <template #extra>
        <a-space size="small">
          <a-button size="small" @click="$emit('replace')" title="搜索替换酒店">🔍 替换</a-button>
        </a-space>
      </template>

      <a-form layout="vertical" size="small">
        <a-row :gutter="12">
          <a-col :span="14">
            <a-form-item label="酒店名称">
              <a-input
                :value="hotel.name"
                @update:value="(v: string) => $emit('update:field', 'name', v)"
                placeholder="酒店名称"
              />
            </a-form-item>
          </a-col>
          <a-col :span="5">
            <a-form-item label="类型">
              <a-select
                :value="hotel.type"
                @update:value="(v: string) => $emit('update:field', 'type', v)"
              >
                <a-select-option value="经济型酒店">经济型</a-select-option>
                <a-select-option value="舒适型酒店">舒适型</a-select-option>
                <a-select-option value="豪华酒店">豪华型</a-select-option>
                <a-select-option value="民宿">民宿</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="5">
            <a-form-item label="费用(元/晚)">
              <a-input-number
                :value="hotel.estimated_cost ?? 0"
                @update:value="(v: number | null) => $emit('update:field', 'estimated_cost', v ?? 0)"
                :min="0"
                :step="50"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="12">
          <a-col :span="16">
            <a-form-item label="地址">
              <a-input
                :value="hotel.address"
                @update:value="(v: string) => $emit('update:field', 'address', v)"
                placeholder="酒店地址"
              />
            </a-form-item>
          </a-col>
          <a-col :span="4">
            <a-form-item label="评分">
              <a-input
                :value="hotel.rating"
                @update:value="(v: string) => $emit('update:field', 'rating', v)"
                placeholder="4.5"
              />
            </a-form-item>
          </a-col>
          <a-col :span="4">
            <a-form-item label="价格区间">
              <a-input
                :value="hotel.price_range"
                @update:value="(v: string) => $emit('update:field', 'price_range', v)"
                placeholder="300-500"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="距离景点">
          <a-input
            :value="hotel.distance"
            @update:value="(v: string) => $emit('update:field', 'distance', v)"
            placeholder="如: 距离景区2公里"
          />
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import type { Hotel } from '@/types'

defineProps<{
  hotel: Hotel
}>()

defineEmits<{
  'update:field': [field: string, value: any]
  'replace': []
}>()
</script>

<style scoped>
.hotel-card {
  border-radius: 10px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: none;
}
.hotel-card :deep(.ant-card-head) {
  background: transparent;
  color: #1565c0;
}
</style>
