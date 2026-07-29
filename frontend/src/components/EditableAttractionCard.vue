<template>
  <div class="editable-attr-card">
    <a-card size="small" :title="attr.name || '新景点'" class="attr-card">
      <template #extra>
        <a-space size="small">
          <a-button size="small" @click="$emit('moveUp')" :disabled="!canMoveUp" title="上移">↑</a-button>
          <a-button size="small" @click="$emit('moveDown')" :disabled="!canMoveDown" title="下移">↓</a-button>
          <a-button size="small" @click="$emit('moveToDay')" title="移至其他天">📅</a-button>
          <a-popconfirm
            title="确定删除此景点？"
            @confirm="$emit('delete')"
            ok-text="删除"
            cancel-text="取消"
          >
            <a-button size="small" danger>🗑️</a-button>
          </a-popconfirm>
        </a-space>
      </template>

      <a-form layout="vertical" size="small">
        <a-row :gutter="12">
          <!-- 景点名 -->
          <a-col :span="12">
            <a-form-item label="景点名称">
              <a-input
                :value="attr.name"
                @update:value="(v: string) => $emit('update:field', 'name', v)"
                placeholder="景点名称"
              />
            </a-form-item>
          </a-col>

          <!-- 类别 -->
          <a-col :span="6">
            <a-form-item label="类别">
              <a-select
                :value="attr.category"
                @update:value="(v: string) => $emit('update:field', 'category', v)"
              >
                <a-select-option value="历史文化">🏛️ 历史文化</a-select-option>
                <a-select-option value="自然风光">🏞️ 自然风光</a-select-option>
                <a-select-option value="美食">🍜 美食</a-select-option>
                <a-select-option value="购物">🛍️ 购物</a-select-option>
                <a-select-option value="艺术">🎨 艺术</a-select-option>
                <a-select-option value="休闲">☕ 休闲</a-select-option>
                <a-select-option value="景点">📍 景点</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <!-- 时长 -->
          <a-col :span="6">
            <a-form-item label="游览时长(分钟)">
              <a-input-number
                :value="attr.visit_duration"
                @update:value="(v: number | null) => $emit('update:field', 'visit_duration', v ?? 60)"
                :min="10"
                :max="600"
                :step="30"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="12">
          <!-- 推荐时段 -->
          <a-col :span="8">
            <a-form-item label="推荐时段">
              <a-select
                :value="attr.recommended_time"
                @update:value="(v: string) => $emit('update:field', 'recommended_time', v)"
                allowClear
                placeholder="不限"
              >
                <a-select-option value="清晨">🌅 清晨</a-select-option>
                <a-select-option value="上午">☀️ 上午</a-select-option>
                <a-select-option value="中午">🌤️ 中午</a-select-option>
                <a-select-option value="下午">⛅ 下午</a-select-option>
                <a-select-option value="傍晚">🌇 傍晚</a-select-option>
                <a-select-option value="晚上">🌙 晚上</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <!-- 门票 -->
          <a-col :span="8">
            <a-form-item label="门票(元)">
              <a-input-number
                :value="attr.ticket_price"
                @update:value="(v: number | null) => $emit('update:field', 'ticket_price', v ?? 0)"
                :min="0"
                :step="10"
                style="width: 100%"
                placeholder="0"
              />
            </a-form-item>
          </a-col>

          <!-- 来源 -->
          <a-col :span="8">
            <a-form-item label="来源">
              <a-tag v-if="attr.source_guide_index !== undefined" color="blue">
                攻略{{ attr.source_guide_index + 1 }}
              </a-tag>
              <span v-else style="color: #999; font-size: 12px;">AI推荐</span>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 地址 -->
        <a-form-item label="地址">
          <a-input
            :value="attr.address"
            @update:value="(v: string) => $emit('update:field', 'address', v)"
            placeholder="景点地址"
          />
        </a-form-item>

        <!-- 描述 -->
        <a-form-item label="描述">
          <a-textarea
            :value="attr.description"
            @update:value="(v: string) => $emit('update:field', 'description', v)"
            :rows="2"
            placeholder="景点描述、攻略提示等"
          />
        </a-form-item>

        <!-- 攻略避坑提示 -->
        <a-form-item v-if="attr.notes" label="💡 攻略提示">
          <a-alert :message="attr.notes" type="info" show-icon style="font-size: 12px;" />
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import type { Attraction } from '@/types'

defineProps<{
  attr: Attraction
  canMoveUp: boolean
  canMoveDown: boolean
}>()

defineEmits<{
  'update:field': [field: string, value: any]
  'moveUp': []
  'moveDown': []
  'moveToDay': []
  'delete': []
}>()
</script>

<style scoped>
.editable-attr-card {
  margin-bottom: 12px;
}
.attr-card {
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  transition: box-shadow 0.2s;
}
.attr-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
