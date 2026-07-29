<template>
  <div class="kanban-column" :class="{ 'kanban-collapsed': collapsed }">
    <!-- 列头 -->
    <div class="kanban-day-header" @click="collapsed = !collapsed">
      <div class="kanban-day-title">
        <span class="day-badge">Day {{ day.day_index + 1 }}</span>
        <span class="day-city" v-if="day.city">{{ day.city }}</span>
      </div>
      <div class="kanban-day-actions">
        <span class="collapse-icon">{{ collapsed ? '▶' : '▼' }}</span>
      </div>
    </div>

    <div v-if="!collapsed" class="kanban-day-body">
      <!-- 日级信息简述 -->
      <div class="kanban-day-info">
        <span v-if="day.date">{{ day.date }}</span>
        <span v-if="day.transportation"> · {{ day.transportation }}</span>
      </div>

      <!-- 景点列表（可拖拽区域） -->
      <div class="kanban-attractions">
        <div
          v-for="(attr, idx) in day.attractions"
          :key="idx"
          class="kanban-attr-chip"
          draggable="true"
          @dragstart="onDragStart($event, day.day_index, idx)"
          @dragover.prevent="onDragOver($event)"
          @drop="onDrop($event, day.day_index, idx)"
          @dragend="$emit('dragEnd')"
        >
          <span class="chip-index">{{ idx + 1 }}</span>
          <div class="chip-info">
            <span class="chip-name">{{ attr.name }}</span>
            <span class="chip-meta">
              {{ attr.visit_duration }}min
              <template v-if="attr.ticket_price"> · ¥{{ attr.ticket_price }}</template>
            </span>
          </div>
          <a-tag
            v-if="attr.source_guide_index !== undefined"
            color="blue"
            size="small"
            style="margin-left: 4px;"
          >
            攻略{{ attr.source_guide_index + 1 }}
          </a-tag>
        </div>

        <!-- 空状态 -->
        <div v-if="day.attractions.length === 0" class="kanban-empty">
          暂未安排景点
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="kanban-day-footer">
        <a-button size="small" type="dashed" block @click="$emit('addAttraction', day.day_index)">
          + 添加景点
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DayPlan } from '@/types'

defineProps<{
  day: DayPlan
}>()

const emit = defineEmits<{
  'addAttraction': [dayIndex: number]
  'dragStart': [fromDay: number, fromIndex: number]
  'drop': [toDay: number, toIndex: number]
  'dragEnd': []
}>()

const collapsed = ref(false)

// 拖拽状态（通过父组件管理）
let dragFromDay = -1
let dragFromIndex = -1

function onDragStart(e: DragEvent, dayIndex: number, attrIndex: number) {
  dragFromDay = dayIndex
  dragFromIndex = attrIndex
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    // Firefox 要求在 dragstart 中显式设置 text/plain 数据
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ dayIndex, attrIndex }))
    } catch (_) {
      // 某些浏览器可能不允许 setData，忽略并依赖模块级变量
    }
  }
  emit('dragStart', dayIndex, attrIndex)
}

function onDragOver(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(e: DragEvent, toDay: number, toIndex: number) {
  // P013-4 修复：不依赖 dataTransfer.getData（Firefox 限制），完全使用模块级变量
  // dragFromDay/dragFromIndex 在 onDragStart 中设置，onDrop 时读取
  e.preventDefault()
  emit('drop', toDay, toIndex)
}
</script>

<style scoped>
.kanban-column {
  width: 280px;
  min-width: 280px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  transition: all 0.2s;
}

.kanban-collapsed {
  width: auto;
  min-width: unset;
}

.kanban-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  user-select: none;
}

.day-badge {
  font-weight: 700;
  font-size: 15px;
}

.day-city {
  margin-left: 6px;
  font-size: 12px;
  opacity: 0.85;
}

.kanban-day-body {
  padding: 12px;
}

.kanban-day-info {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
  text-align: center;
}

.kanban-attractions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
  min-height: 60px;
}

.kanban-attr-chip {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  cursor: grab;
  transition: all 0.15s;
}

.kanban-attr-chip:hover {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.kanban-attr-chip:active {
  cursor: grabbing;
  opacity: 0.7;
}

.chip-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8px;
}

.chip-info {
  flex: 1;
  min-width: 0;
}

.chip-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-meta {
  font-size: 11px;
  color: #999;
  margin-top: 1px;
}

.kanban-empty {
  text-align: center;
  color: #ccc;
  font-size: 13px;
  padding: 20px 0;
}

.kanban-day-footer {
  margin-top: 8px;
}
</style>
