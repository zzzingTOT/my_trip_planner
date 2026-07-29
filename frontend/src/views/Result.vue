<template>
  <div class="result-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <a-button class="back-button" size="large" @click="goBack">
        ← 返回首页
      </a-button>
      <a-space size="middle">
        <!-- 查看模式 -->
        <template v-if="!editMode">
          <a-button @click="enterEditMode" type="default">
            ✏️ 编辑行程
          </a-button>
          <!-- 导出按钮 -->
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item key="image" @click="exportAsImage">
                  📷 导出为图片
                </a-menu-item>
                <a-menu-item key="pdf" @click="exportAsPDF">
                  📄 导出为PDF
                </a-menu-item>
              </a-menu>
            </template>
            <a-button type="default">
              📥 导出行程 <DownOutlined />
            </a-button>
          </a-dropdown>
        </template>

        <!-- 编辑模式工具栏 -->
        <template v-else>
          <a-button @click="undo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">↩ 撤销</a-button>
          <a-button @click="redo" :disabled="!canRedo" title="重做 (Ctrl+Y)">↪ 重做</a-button>
          <a-divider type="vertical" />
          <!-- 视图切换 -->
          <a-radio-group v-model:value="viewMode" size="small" button-style="solid" @change="onViewModeChange">
            <a-radio-button value="list">📋 列表</a-radio-button>
            <a-radio-button value="kanban">🗂️ 看板</a-radio-button>
          </a-radio-group>
          <a-divider type="vertical" />
          <a-tag v-if="isDirty" color="orange">● 有未保存的修改</a-tag>
          <a-button @click="saveChanges" type="primary">💾 保存修改</a-button>
          <a-button @click="cancelEdit" type="default">❌ 取消编辑</a-button>
        </template>
      </a-space>
    </div>

    <div v-if="tripPlan" class="content-wrapper">
      <!-- ====== 摘要卡片（首屏顶部） ====== -->
      <div class="summary-bar">
        <div class="summary-card">
          <div class="summary-icon">📍</div>
          <div class="summary-info">
            <div class="summary-route">{{ tripPlan.departure_city }} → {{ tripPlan.cities.join(' → ') }}</div>
            <div class="summary-meta">
              <span>{{ tripPlan.start_date }} ~ {{ tripPlan.end_date }}</span>
              <span class="meta-sep">·</span>
              <span>{{ tripPlan.days.length }}天行程</span>
              <span class="meta-sep">·</span>
              <span v-if="tripPlan.budget">预算 ¥{{ tripPlan.budget.total.toLocaleString() }}</span>
            </div>
          </div>
          <!-- 预算迷你条形图 -->
          <div class="summary-budget-bar" v-if="tripPlan.budget">
            <div class="bar-segment bar-attractions" :style="{ width: budgetPercent('attractions') }" title="门票"></div>
            <div class="bar-segment bar-hotels" :style="{ width: budgetPercent('hotels') }" title="住宿"></div>
            <div class="bar-segment bar-meals" :style="{ width: budgetPercent('meals') }" title="餐饮"></div>
            <div class="bar-segment bar-transport" :style="{ width: budgetPercent('transport') }" title="交通"></div>
            <div class="bar-segment bar-intercity" :style="{ width: budgetPercent('intercity') }" title="跨城"></div>
          </div>
        </div>
      </div>

      <div class="main-layout">
        <!-- 侧边导航 -->
        <div class="side-nav">
          <a-affix :offset-top="88">
            <div class="nav-card">
              <a-menu mode="inline" :selected-keys="[activeSection]" @click="scrollToSection">
                <a-menu-item key="overview">行程概览</a-menu-item>
                <a-menu-item key="budget" v-if="tripPlan.budget">预算明细</a-menu-item>
                <a-menu-item key="transport" v-if="tripPlan.inter_city_transport?.length">跨城交通</a-menu-item>
                <a-menu-item key="map">景点地图</a-menu-item>
                <a-sub-menu key="days" title="每日行程">
                  <a-menu-item v-for="(day, index) in tripPlan.days" :key="`day-${index}`">
                    Day {{ day.day_index + 1 }}
                  </a-menu-item>
                </a-sub-menu>
                <a-menu-item key="weather" v-if="tripPlan.weather_info?.length">天气信息</a-menu-item>
              </a-menu>
            </div>
          </a-affix>
        </div>

        <!-- 主内容区 -->
        <div class="main-content">
          <!-- 每日行程 — 默认展开，首屏直接可见 -->
          <div id="overview" class="section-card">
            <div class="section-title-row">
              <span>📅 每日行程</span>
              <a-button v-if="!editMode" size="small" @click="enterEditMode">✏️ 编辑</a-button>
            </div>

            <!-- ===== 列表视图（查看 + 编辑） ===== -->
            <a-card v-if="viewMode === 'list'" :bordered="false" style="box-shadow: none;">
              <a-collapse v-model:activeKey="activeDays" accordion>
                <a-collapse-panel
                  v-for="(day, index) in tripPlan!.days"
                  :key="index"
                  :id="`day-${index}`"
                >
                  <template #header>
                    <div class="day-header">
                      <span class="day-badge-sm">Day {{ day.day_index + 1 }}</span>
                      <span class="day-city-tag" v-if="day.city">{{ day.city }}</span>
                      <span class="day-date-sm">{{ day.date }}</span>
                    </div>
                  </template>

                  <!-- 查看模式：时间轴卡片 -->
                  <div v-if="!editMode" class="day-timeline">
                    <div class="timeline-attr" v-for="(attr, attrIdx) in day.attractions" :key="attrIdx">
                      <div class="timeline-dot">{{ attrIdx + 1 }}</div>
                      <div class="timeline-card">
                        <div class="tl-card-header">
                          <span class="tl-name">{{ attr.name }}</span>
                          <span class="tl-duration">{{ attr.visit_duration }}min</span>
                        </div>
                        <div class="tl-card-body" v-if="attr.description">{{ attr.description }}</div>
                        <div class="tl-card-tags">
                          <a-tag v-if="attr.category" size="small">{{ attr.category }}</a-tag>
                          <a-tag v-if="attr.ticket_price" color="orange" size="small">¥{{ attr.ticket_price }}</a-tag>
                          <a-tag v-if="attr.recommended_time" color="green" size="small">{{ attr.recommended_time }}</a-tag>
                          <a-tag v-if="attr.source_guide_index !== undefined" color="blue" size="small">攻略{{ attr.source_guide_index + 1 }}</a-tag>
                        </div>
                        <div v-if="attr.notes" class="tl-card-notes">💡 {{ attr.notes }}</div>
                      </div>
                    </div>
                    <!-- 酒店 -->
                    <div v-if="day.hotel" class="timeline-hotel">
                      🏨 {{ day.hotel.name }} · {{ day.hotel.type }} · ¥{{ day.hotel.estimated_cost || '?' }}/晚
                    </div>
                  </div>

                  <!-- 编辑模式 -->
                  <template v-else>
                    <DayEditorHeader
                      :day="day"
                      :can-delete-day="tripPlan!.days.length > 1"
                      @update:field="(f, v) => updateDayInfo(day.day_index, f, v)"
                      @duplicate="duplicateDay(day.day_index)"
                      @add-day-after="addDay(day.day_index)"
                      @delete-day="deleteDay(day.day_index)"
                    />
                    <div class="editable-attractions">
                      <EditableAttractionCard
                        v-for="(attr, attrIdx) in day.attractions" :key="attrIdx"
                        :attr="attr"
                        :can-move-up="attrIdx > 0"
                        :can-move-down="attrIdx < day.attractions.length - 1"
                        @update:field="(f, v) => updateAttr(day.day_index, attrIdx, f, v)"
                        @move-up="moveAttraction(day.day_index, attrIdx, attrIdx - 1)"
                        @move-down="moveAttraction(day.day_index, attrIdx, attrIdx + 1)"
                        @move-to-day="moveDayFromDay = day.day_index; moveDayFromIndex = attrIdx; moveDayModalVisible = true"
                        @delete="pushSnapshot(); deleteAttr(day.day_index, attrIdx)"
                      />
                      <a-button size="small" type="dashed" block @click="pushSnapshot(); addAttraction(day.day_index)">+ 添加景点</a-button>
                    </div>
                    <div style="margin-top: 12px;">
                      <EditableHotelCard v-if="day.hotel" :hotel="day.hotel" @update:field="(f, v) => updateHotel(day.day_index, f, v)" @replace="() => {}" />
                      <EditableMealList
                        :meals="day.meals"
                        @update-meal="(idx, f, v) => updateMeal(day.day_index, idx, f, v)"
                        @delete-meal="(idx) => { pushSnapshot(); deleteMeal(day.day_index, idx) }"
                        @add-meal="() => { pushSnapshot(); addMeal(day.day_index) }"
                      />
                    </div>
                  </template>
                </a-collapse-panel>
              </a-collapse>
            </a-card>

            <!-- 行程概览 + 跨城交通（折叠在下方） -->
            <div class="section-card" v-if="tripPlan.inter_city_transport?.length">
              <div class="section-title-row">🚄 跨城交通</div>
              <div class="transport-list">
                <div v-for="(transport, index) in tripPlan.inter_city_transport" :key="index" class="transport-item">
                  <div class="transport-route">
                    <span class="transport-from">{{ transport.from_city }}</span>
                    <span class="transport-arrow">→</span>
                    <span class="transport-to">{{ transport.to_city }}</span>
                  </div>
                  <div class="transport-detail">
                    <a-tag :color="getTransportColor(transport.mode)">{{ transport.mode }}</a-tag>
                    <span class="transport-duration">⏱️ {{ transport.duration }}</span>
                    <span class="transport-cost">💰 ¥{{ transport.estimated_cost }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 预算明细 -->
            <div id="budget" class="section-card" v-if="tripPlan.budget">
              <div class="section-title-row">💰 预算明细</div>
              <div class="budget-grid">
                <div class="budget-item">
                  <div class="budget-label">🚄 跨城交通</div>
                  <div class="budget-value">¥{{ tripPlan.budget.total_inter_city_transport }}</div>
                </div>
                <div class="budget-item">
                  <div class="budget-label">景点门票</div>
                  <div class="budget-value">¥{{ tripPlan.budget.total_attractions }}</div>
                </div>
                <div class="budget-item">
                  <div class="budget-label">酒店住宿</div>
                  <div class="budget-value">¥{{ tripPlan.budget.total_hotels }}</div>
                </div>
                <div class="budget-item">
                  <div class="budget-label">餐饮费用</div>
                  <div class="budget-value">¥{{ tripPlan.budget.total_meals }}</div>
                </div>
                <div class="budget-item">
                  <div class="budget-label">🚗 城内交通</div>
                  <div class="budget-value">¥{{ tripPlan.budget.total_transportation }}</div>
                </div>
              </div>
              <div class="budget-total">
                <span class="total-label">预估总费用</span>
                <span class="total-value">¥{{ tripPlan.budget.total }}</span>
              </div>
            </div>

            <!-- 地图 -->
            <div id="map" class="section-card">
              <div class="section-title-row">📍 景点地图</div>
              <div class="map-wrapper" style="min-height: 400px; position: relative;">


                <div id="amap-container" class="map-container"></div>

                <!-- 地图加载失败时的降级提示（覆盖层） -->
                <div v-if="mapLoadError" class="map-error-fallback">
                  <div class="map-error-icon">🗺️</div>
                  <div class="map-error-title">地图加载失败</div>
                  <div class="map-error-reason">{{ mapErrorMessage }}</div>
                  <div class="map-error-tips">
                    <p><strong>可能的原因：</strong></p>
                    <ul>
                      <li>高德地图 JS API Key 未配置或已过期</li>
                      <li>Key 未在高德控制台开启"JS API"服务</li>
                      <li>Key 的安全域名未包含当前访问地址</li>
                      <li>网络连接异常</li>
                    </ul>
                    <p><strong>解决办法：</strong></p>
                    <ol>
                      <li>前往 <a href="https://console.amap.com/dev/key/app" target="_blank">高德开放平台控制台</a></li>
                      <li>确认 Key 已开启"Web端 JS API"服务</li>
                      <li>在 <code>frontend/.env</code> 中设置 <code>VITE_AMAP_WEB_JS_KEY=你的Key</code></li>
                      <li>重启前端开发服务器（<code>npm run dev</code>）</li>
                    </ol>
                  </div>
                  <a-button type="primary" @click="retryLoadMap" :loading="mapRetrying">
                    🔄 重新加载地图
                  </a-button>
                </div>

                <!-- 地图加载中（覆盖层） -->
                <div v-if="mapLoading && !mapLoadError" class="map-loading-state">
                  <div class="map-loading-spinner"></div>
                  <div class="map-loading-text">正在加载地图...</div>
                  <div class="map-loading-sub">获取高德地图 SDK，请稍候</div>
                </div>
              </div>
            </div>

            <!-- 每日行程（下面已经通过section-card渲染了） -->
          </div>
        </div>

        <!-- 每日行程 -->
        <!-- ===== 看板视图 ===== -->
        <div v-if="editMode && viewMode === 'kanban'" class="kanban-view">
          <div class="kanban-toolbar">
            <a-button size="small" type="dashed" @click="addDay(tripPlan!.days.length - 1)">
              + 在末尾添加一天
            </a-button>
          </div>
          <div class="kanban-columns">
            <DayKanbanColumn
              v-for="day in tripPlan!.days"
              :key="day.day_index"
              :day="day"
              @add-attraction="(di: number) => addAttraction(di)"
              @drag-start="(fromDay: number, fromIdx: number) => { moveDayFromDay = fromDay; moveDayFromIndex = fromIdx }"
              @drop="(toDay: number, toIdx: number) => {
                if (moveDayFromDay === toDay) {
                  moveAttraction(toDay, moveDayFromIndex, toIdx)
                } else {
                  moveAttractionToDay(moveDayFromDay, moveDayFromIndex, toDay, toIdx)
                }
              }"
              @drag-end="() => { moveDayFromDay = -1; moveDayFromIndex = -1 }"
            />
          </div>
          <!-- 看板中点击景点打开编辑弹窗 -->
        </div>

        <!-- ===== 列表视图（查看+编辑） ===== -->
        <a-card
          v-if="viewMode === 'list'"
          :title="'📅 每日行程' + (editMode ? ' (编辑模式)' : '')"
          :bordered="false"
          class="days-card"
        >
          <a-collapse v-model:activeKey="activeDays" accordion>
            <a-collapse-panel
              v-for="(day, index) in tripPlan!.days"
              :key="index"
              :id="`day-${index}`"
            >
              <template #header>
                <div class="day-header">
                  <span class="day-title">第{{ day.day_index + 1 }}天</span>
                  <a-tag v-if="day.city" color="purple" style="margin-left: 8px;">{{ day.city }}</a-tag>
                  <span class="day-date">{{ day.date }}</span>
                </div>
              </template>

              <!-- 编辑模式：日级信息 -->
              <DayEditorHeader
                v-if="editMode"
                :day="day"
                :can-delete-day="tripPlan!.days.length > 1"
                @update:field="(f: string, v: any) => updateDayInfo(day.day_index, f, v)"
                @duplicate="duplicateDay(day.day_index)"
                @add-day-after="addDay(day.day_index)"
                @delete-day="deleteDay(day.day_index)"
              />

              <!-- 查看模式：日级信息 -->
              <div v-else class="day-info">
                <div class="info-row">
                  <span class="label">📝 行程描述:</span>
                  <span class="value">{{ day.description }}</span>
                </div>
                <div class="info-row">
                  <span class="label">🚗 交通方式:</span>
                  <span class="value">{{ day.transportation }}</span>
                </div>
                <div class="info-row">
                  <span class="label">🏨 住宿:</span>
                  <span class="value">{{ day.accommodation }}</span>
                </div>
              </div>

              <!-- 景点安排 - 编辑模式 -->
              <template v-if="editMode">
                <a-divider orientation="left">
                  🎯 景点安排
                  <a-button size="small" type="dashed" @click="() => { pushSnapshot(); addAttraction(day.day_index) }" style="margin-left: 8px;">+ 添加景点</a-button>
                </a-divider>
                <div class="editable-attractions">
                  <EditableAttractionCard
                    v-for="(attr, attrIdx) in day.attractions"
                    :key="attrIdx"
                    :attr="attr"
                    :can-move-up="attrIdx > 0"
                    :can-move-down="attrIdx < day.attractions.length - 1"
                    @update:field="(f: string, v: any) => updateAttr(day.day_index, attrIdx, f, v)"
                    @move-up="moveAttraction(day.day_index, attrIdx, attrIdx - 1)"
                    @move-down="moveAttraction(day.day_index, attrIdx, attrIdx + 1)"
                    @move-to-day="() => { moveDayFromDay = day.day_index; moveDayFromIndex = attrIdx; moveDayModalVisible = true }"
                    @delete="() => { pushSnapshot(); deleteAttr(day.day_index, attrIdx) }"
                  />
                </div>
              </template>

              <!-- 景点安排 - 查看模式 -->
              <template v-else>
                <a-divider orientation="left">🎯 景点安排</a-divider>
                <a-list
                  :data-source="day.attractions"
                  :grid="{ gutter: 16, column: 2 }"
                >
                  <template #renderItem="{ item, index: attrIdx }">
                    <a-list-item>
                      <a-card :title="item.name" size="small" class="attraction-card">
                        <div class="attraction-image-wrapper">
                          <img
                            :src="getAttractionImage(item.name, attrIdx)"
                            :alt="item.name"
                            class="attraction-image"
                            @error="handleImageError"
                          />
                          <div class="attraction-badge">
                            <span class="badge-number">{{ attrIdx + 1 }}</span>
                          </div>
                          <div v-if="item.ticket_price" class="price-tag">¥{{ item.ticket_price }}</div>
                        </div>
                        <p><strong>地址:</strong> {{ item.address }}</p>
                        <p><strong>游览时长:</strong> {{ item.visit_duration }}分钟</p>
                        <p><strong>描述:</strong> {{ item.description }}</p>
                        <p v-if="item.rating"><strong>评分:</strong> {{ item.rating }}⭐</p>
                        <p v-if="item.notes" style="color: #fa8c16;">💡 {{ item.notes }}</p>
                        <a-tag v-if="item.source_guide_index !== undefined" color="blue" size="small">
                          来自攻略{{ item.source_guide_index + 1 }}
                        </a-tag>
                      </a-card>
                    </a-list-item>
                  </template>
                </a-list>
              </template>

              <!-- 酒店 - 编辑模式 -->
              <template v-if="editMode">
                <a-divider orientation="left">🏨 住宿推荐</a-divider>
                <EditableHotelCard
                  v-if="day.hotel"
                  :hotel="day.hotel"
                  @update:field="(f: string, v: any) => updateHotel(day.day_index, f, v)"
                  @replace="() => {}"
                />
                <a-button v-else size="small" type="dashed" @click="() => { pushSnapshot(); updateHotel(day.day_index, 'name', '') }">
                  + 添加酒店
                </a-button>

                <!-- 餐饮 - 编辑模式 -->
                <a-divider orientation="left">🍽️ 餐饮安排</a-divider>
                <EditableMealList
                  :meals="day.meals"
                  @update-meal="(idx, f, v) => updateMeal(day.day_index, idx, f, v)"
                  @delete-meal="(idx) => { pushSnapshot(); deleteMeal(day.day_index, idx) }"
                  @add-meal="() => { pushSnapshot(); addMeal(day.day_index) }"
                />
              </template>

              <!-- 酒店 - 查看模式 -->
              <template v-else>
                <a-divider v-if="day.hotel" orientation="left">🏨 住宿推荐</a-divider>
                <a-card v-if="day.hotel" size="small" class="hotel-card">
                  <template #title>
                    <span class="hotel-title">{{ day.hotel.name }}</span>
                  </template>
                  <a-descriptions :column="2" size="small">
                    <a-descriptions-item label="地址">{{ day.hotel.address }}</a-descriptions-item>
                    <a-descriptions-item label="类型">{{ day.hotel.type }}</a-descriptions-item>
                    <a-descriptions-item label="价格范围">{{ day.hotel.price_range }}</a-descriptions-item>
                    <a-descriptions-item label="评分">{{ day.hotel.rating }}⭐</a-descriptions-item>
                    <a-descriptions-item label="距离" :span="2">{{ day.hotel.distance }}</a-descriptions-item>
                  </a-descriptions>
                </a-card>

                <a-divider orientation="left">🍽️ 餐饮安排</a-divider>
                <a-descriptions :column="1" bordered size="small">
                  <a-descriptions-item
                    v-for="meal in day.meals"
                    :key="meal.type"
                    :label="getMealLabel(meal.type)"
                  >
                    {{ meal.name }}
                    <span v-if="meal.description"> - {{ meal.description }}</span>
                  </a-descriptions-item>
                </a-descriptions>
              </template>
            </a-collapse-panel>
          </a-collapse>
        </a-card>

        <!-- 跨天移动弹窗 -->
        <a-modal
          v-model:open="moveDayModalVisible"
          title="将景点移动到哪一天？"
          @ok="() => {
            if (targetDay.value !== null && moveDayFromDay >= 0) {
              moveAttractionToDay(moveDayFromDay, moveDayFromIndex, targetDay.value)
              moveDayModalVisible = false
            }
          }"
          ok-text="移动"
          cancel-text="取消"
        >
          <a-select
            v-model:value="targetDay"
            style="width: 100%"
            placeholder="选择目标天数"
          >
            <a-select-option
              v-for="(d, i) in tripPlan!.days"
              :key="i"
              :value="d.day_index"
              :disabled="d.day_index === moveDayFromDay"
            >
              第{{ d.day_index + 1 }}天{{ d.city ? ' - ' + d.city : '' }}
            </a-select-option>
          </a-select>
        </a-modal>

        <a-card id="weather" v-if="tripPlan.weather_info && tripPlan.weather_info.length > 0" title="天气信息" style="margin-top: 20px" :bordered="false">
        <a-list
          :data-source="tripPlan.weather_info"
          :grid="{ gutter: 16, column: 3 }"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-card size="small" class="weather-card">
                <div class="weather-date">{{ item.date }}</div>
                <div class="weather-info-row">
                  <span class="weather-icon">☀️</span>
                  <div>
                    <div class="weather-label">白天</div>
                    <div class="weather-value">{{ item.day_weather }} {{ item.day_temp }}°C</div>
                  </div>
                </div>
                <div class="weather-info-row">
                  <span class="weather-icon">🌙</span>
                  <div>
                    <div class="weather-label">夜间</div>
                    <div class="weather-value">{{ item.night_weather }} {{ item.night_temp }}°C</div>
                  </div>
                </div>
                <div class="weather-wind">
                  💨 {{ item.wind_direction }} {{ item.wind_power }}
                </div>
              </a-card>
            </a-list-item>
          </template>
        </a-list>
        </a-card>
      </div>
    </div>

    <a-empty v-else description="没有找到旅行计划数据">
      <template #image>
        <div style="font-size: 80px;">🗺️</div>
      </template>
      <template #description>
        <span style="color: #999;">暂无旅行计划数据,请先创建行程</span>
      </template>
      <a-button type="primary" @click="goBack">返回首页创建行程</a-button>
    </a-empty>

    <!-- 回到顶部按钮 -->
    <a-back-top :visibility-height="300">
      <div class="back-top-button">
        ↑
      </div>
    </a-back-top>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { TripPlan } from '@/types'
import { useTripEditor, createEmptyAttraction } from '@/composables/useTripEditor'
import EditableAttractionCard from '@/components/EditableAttractionCard.vue'
import EditableHotelCard from '@/components/EditableHotelCard.vue'
import EditableMealList from '@/components/EditableMealList.vue'
import DayEditorHeader from '@/components/DayEditorHeader.vue'
import DayKanbanColumn from '@/components/DayKanbanColumn.vue'

const router = useRouter()
const tripPlan = ref<TripPlan | null>(null)
const attractionPhotos = ref<Record<string, string>>({})
const activeSection = ref('overview')
const activeDays = ref<number[]>([0]) // 默认展开第一天
let map: any = null
const mapLoadError = ref(false)
const mapErrorMessage = ref('')
const mapRetrying = ref(false)
const mapLoading = ref(false)

// 编辑器
const editor = useTripEditor(tripPlan)
const {
  editMode, isDirty, viewMode, canUndo, canRedo, draftExists, draftDate,
  undo, redo, pushSnapshot,
  addDay, deleteDay, duplicateDay, updateDayInfo,
  addAttraction, updateAttraction: updateAttr, deleteAttraction: deleteAttr,
  moveAttraction, moveAttractionToDay,
  updateHotel, replaceHotel,
  updateMeal, deleteMeal, addMeal,
  autoRecalculateBudget,
  checkDraft, restoreDraft, clearDraft,
  enterEditMode, saveChanges: editorSave, cancelEdit: editorCancel,
} = editor

// 跨天移动弹窗状态
const moveDayModalVisible = ref(false)
const moveDayFromDay = ref(-1)
const moveDayFromIndex = ref(-1)
const targetDay = ref<number | null>(null)

onMounted(async () => {
  const data = sessionStorage.getItem('tripPlan')
  if (data) {
    tripPlan.value = JSON.parse(data)
    // 检查草稿
    const { exists, date } = checkDraft()
    if (exists) {
      Modal.confirm({
        title: '检测到未完成的编辑',
        content: `上一次编辑于 ${date ? new Date(date).toLocaleString() : '未知时间'}，是否恢复？`,
        okText: '恢复编辑',
        cancelText: '放弃草稿',
        onOk: () => { restoreDraft() },
        onCancel: () => { clearDraft() },
      })
    }
    await nextTick()
    await Promise.all([
      loadAttractionPhotos(),
      initMap()
    ])
  }
})

// 编辑保存后刷新地图
const saveChanges = () => {
  const needMapRefresh = editorSave()
  if (needMapRefresh && map) {
    map.destroy()
    map = null
    nextTick(() => initMap())
  }
}

const cancelEdit = () => {
  const needMapRefresh = editorCancel()
  if (needMapRefresh && map) {
    map.destroy()
    map = null
    nextTick(() => initMap())
  }
}

// P013-2 修复：视图切换前保存快照，防止未保存的新增数据丢失
function onViewModeChange() {
  pushSnapshot()
}

// 预算条形图百分比计算
function budgetPercent(cat: 'attractions' | 'hotels' | 'meals' | 'transport' | 'intercity'): string {
  if (!tripPlan.value?.budget || tripPlan.value.budget.total <= 0) return '0%'
  const b = tripPlan.value.budget
  const map: Record<string, number> = {
    attractions: b.total_attractions,
    hotels: b.total_hotels,
    meals: b.total_meals,
    transport: b.total_transportation,
    intercity: b.total_inter_city_transport,
  }
  const val = map[cat] || 0
  return Math.round((val / b.total) * 100) + '%'
}

// watch 地图联动：编辑模式下景点变化实时更新标记
watch(
  () => tripPlan.value?.days?.flatMap(d => d.attractions.map(a => a.name + a.visit_duration)),
  () => {
    if (editMode.value && map && !mapLoading.value && !mapLoadError.value) {
      // 简易刷新：销毁标记重绘
      map.clearMap()
      // 重新添加标记需要 AMap 实例，这里在编辑模式下仅在保存时刷新地图
      // 实时联动控制在看板视图中处理
    }
  },
  { deep: true }
)

const getMealLabel = (type: string): string => {
  const labels: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '小吃'
  }
  return labels[type] || type
}

// 【新增】根据交通方式返回不同颜色标签
const getTransportColor = (mode: string): string => {
  const colorMap: Record<string, string> = {
    '高铁': 'blue',
    '动车': 'cyan',
    '飞机': 'red',
    '自驾': 'green',
    '大巴': 'orange',
    '火车': 'geekblue'
  }
  return colorMap[mode] || 'default'
}

// 加载所有景点图片
const loadAttractionPhotos = async () => {
  if (!tripPlan.value) return

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const promises: Promise<void>[] = []

  tripPlan.value.days.forEach(day => {
    day.attractions.forEach(attraction => {
      const promise = fetch(`${apiBase}/api/poi/photo?name=${encodeURIComponent(attraction.name)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.photo_url) {
            attractionPhotos.value[attraction.name] = data.data.photo_url
          }
        })
        .catch(err => {
          console.error(`获取${attraction.name}图片失败:`, err)
        })

      promises.push(promise)
    })
  })

  await Promise.all(promises)
}

// 获取景点图片
const getAttractionImage = (name: string, index: number): string => {
  // 如果已加载真实图片,返回真实图片
  if (attractionPhotos.value[name]) {
    return attractionPhotos.value[name]
  }

  // 返回一个纯色占位图(避免跨域问题)
  const colors = [
    { start: '#667eea', end: '#764ba2' },
    { start: '#f093fb', end: '#f5576c' },
    { start: '#4facfe', end: '#00f2fe' },
    { start: '#43e97b', end: '#38f9d7' },
    { start: '#fa709a', end: '#fee140' }
  ]
  const colorIndex = index % colors.length
  const { start, end } = colors[colorIndex]

  // 使用base64编码避免中文问题
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <defs>
      <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${start};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${end};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#grad${index})"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="white">${name}</text>
  </svg>`

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

// 图片加载失败时的处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 使用灰色占位图
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3E图片加载失败%3C/text%3E%3C/svg%3E'
}



// 导出为图片
const exportAsImage = async () => {
  try {
    message.loading({ content: '正在生成图片...', key: 'export', duration: 0 })

    const element = document.querySelector('.main-content') as HTMLElement
    if (!element) {
      throw new Error('未找到内容元素')
    }

    // 创建一个独立的容器
    const exportContainer = document.createElement('div')
    exportContainer.style.width = element.offsetWidth + 'px'
    exportContainer.style.backgroundColor = '#f5f7fa'
    exportContainer.style.padding = '20px'

    // 复制所有内容
    exportContainer.innerHTML = element.innerHTML

    // 处理地图截图
    const mapContainer = document.getElementById('amap-container')
    if (mapContainer && map) {
      const mapCanvas = mapContainer.querySelector('canvas')
      if (mapCanvas) {
        const mapSnapshot = mapCanvas.toDataURL('image/png')
        const exportMapContainer = exportContainer.querySelector('#amap-container')
        if (exportMapContainer) {
          exportMapContainer.innerHTML = `<img src="${mapSnapshot}" style="width:100%;height:100%;object-fit:cover;" />`
        }
      }
    }

    // 移除所有ant-card类,替换为纯div
    const cards = exportContainer.querySelectorAll('.ant-card')
    cards.forEach((card) => {
      const cardEl = card as HTMLElement
      try {
        cardEl.className = '' // 移除所有类
        cardEl.style.setProperty('background-color', '#ffffff')
        cardEl.style.setProperty('border-radius', '12px')
        cardEl.style.setProperty('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.1)')
        cardEl.style.setProperty('margin-bottom', '20px')
        cardEl.style.setProperty('overflow', 'hidden')
      } catch (err) {
        console.error('设置卡片样式失败:', err)
      }
    })

    // 处理卡片头部
    const cardHeads = exportContainer.querySelectorAll('.ant-card-head')
    cardHeads.forEach((head) => {
      const headEl = head as HTMLElement
      try {
        headEl.style.setProperty('background-color', '#667eea')
        headEl.style.setProperty('color', '#ffffff')
        headEl.style.setProperty('padding', '16px 24px')
        headEl.style.setProperty('font-size', '18px')
        headEl.style.setProperty('font-weight', '600')
      } catch (err) {
        console.error('设置卡片头部样式失败:', err)
      }
    })

    // 处理卡片内容
    const cardBodies = exportContainer.querySelectorAll('.ant-card-body')
    cardBodies.forEach((body) => {
      const bodyEl = body as HTMLElement
      bodyEl.style.setProperty('background-color', '#ffffff')
      bodyEl.style.setProperty('padding', '24px')
    })

    // 处理酒店卡片头部
    const hotelCards = exportContainer.querySelectorAll('.hotel-card')
    hotelCards.forEach((card) => {
      const head = card.querySelector('.ant-card-head') as HTMLElement
      if (head) {
        head.style.setProperty('background-color', '#1976d2')
      }
      (card as HTMLElement).style.setProperty('background-color', '#e3f2fd')
    })

    // 处理天气卡片
    const weatherCards = exportContainer.querySelectorAll('.weather-card')
    weatherCards.forEach((card) => {
      (card as HTMLElement).style.setProperty('background-color', '#e0f7fa')
    })

    // 处理预算总计
    const budgetTotal = exportContainer.querySelector('.budget-total')
    if (budgetTotal) {
      const el = budgetTotal as HTMLElement
      el.style.setProperty('background-color', '#667eea')
      el.style.setProperty('color', '#ffffff')
      el.style.setProperty('padding', '20px')
      el.style.setProperty('border-radius', '12px')
      el.style.setProperty('margin-bottom', '20px')
    }

    // 处理预算项
    const budgetItems = exportContainer.querySelectorAll('.budget-item')
    budgetItems.forEach((item) => {
      const el = item as HTMLElement
      el.style.setProperty('background-color', '#f5f7fa')
      el.style.setProperty('padding', '16px')
      el.style.setProperty('border-radius', '8px')
      el.style.setProperty('margin-bottom', '12px')
    })

    // 添加到body(隐藏)
    exportContainer.style.position = 'absolute'
    exportContainer.style.left = '-9999px'
    document.body.appendChild(exportContainer)

    const canvas = await html2canvas(exportContainer, {
      backgroundColor: '#f5f7fa',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true
    })

    // 移除容器
    document.body.removeChild(exportContainer)

    // 转换为图片并下载
    const link = document.createElement('a')
    link.download = `旅行计划_${tripPlan.value?.cities?.join('_')}_${new Date().getTime()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    message.success({ content: '图片导出成功!', key: 'export' })
  } catch (error: any) {
    console.error('导出图片失败:', error)
    message.error({ content: `导出图片失败: ${error.message}`, key: 'export' })
  }
}

// 导出为PDF
const exportAsPDF = async () => {
  try {
    message.loading({ content: '正在生成PDF...', key: 'export', duration: 0 })

    const element = document.querySelector('.main-content') as HTMLElement
    if (!element) {
      throw new Error('未找到内容元素')
    }

    // 创建一个独立的容器
    const exportContainer = document.createElement('div')
    exportContainer.style.width = element.offsetWidth + 'px'
    exportContainer.style.backgroundColor = '#f5f7fa'
    exportContainer.style.padding = '20px'

    // 复制所有内容
    exportContainer.innerHTML = element.innerHTML

    // 处理地图截图
    const mapContainer = document.getElementById('amap-container')
    if (mapContainer && map) {
      const mapCanvas = mapContainer.querySelector('canvas')
      if (mapCanvas) {
        const mapSnapshot = mapCanvas.toDataURL('image/png')
        const exportMapContainer = exportContainer.querySelector('#amap-container')
        if (exportMapContainer) {
          exportMapContainer.innerHTML = `<img src="${mapSnapshot}" style="width:100%;height:100%;object-fit:cover;" />`
        }
      }
    }

    // 移除所有ant-card类,替换为纯div
    const cards = exportContainer.querySelectorAll('.ant-card')
    cards.forEach((card) => {
      const cardEl = card as HTMLElement
      try {
        cardEl.className = ''
        cardEl.style.setProperty('background-color', '#ffffff')
        cardEl.style.setProperty('border-radius', '12px')
        cardEl.style.setProperty('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.1)')
        cardEl.style.setProperty('margin-bottom', '20px')
        cardEl.style.setProperty('overflow', 'hidden')
      } catch (err) {
        console.error('设置卡片样式失败:', err)
      }
    })

    // 处理卡片头部
    const cardHeads = exportContainer.querySelectorAll('.ant-card-head')
    cardHeads.forEach((head) => {
      const headEl = head as HTMLElement
      try {
        headEl.style.setProperty('background-color', '#667eea')
        headEl.style.setProperty('color', '#ffffff')
        headEl.style.setProperty('padding', '16px 24px')
        headEl.style.setProperty('font-size', '18px')
        headEl.style.setProperty('font-weight', '600')
      } catch (err) {
        console.error('设置卡片头部样式失败:', err)
      }
    })

    // 处理卡片内容
    const cardBodies = exportContainer.querySelectorAll('.ant-card-body')
    cardBodies.forEach((body) => {
      const bodyEl = body as HTMLElement
      bodyEl.style.setProperty('background-color', '#ffffff')
      bodyEl.style.setProperty('padding', '24px')
    })

    // 处理酒店卡片头部
    const hotelCards = exportContainer.querySelectorAll('.hotel-card')
    hotelCards.forEach((card) => {
      const head = card.querySelector('.ant-card-head') as HTMLElement
      if (head) {
        head.style.setProperty('background-color', '#1976d2')
      }
      (card as HTMLElement).style.setProperty('background-color', '#e3f2fd')
    })

    // 处理天气卡片
    const weatherCards = exportContainer.querySelectorAll('.weather-card')
    weatherCards.forEach((card) => {
      (card as HTMLElement).style.setProperty('background-color', '#e0f7fa')
    })

    // 处理预算总计
    const budgetTotal = exportContainer.querySelector('.budget-total')
    if (budgetTotal) {
      const el = budgetTotal as HTMLElement
      el.style.setProperty('background-color', '#667eea')
      el.style.setProperty('color', '#ffffff')
      el.style.setProperty('padding', '20px')
      el.style.setProperty('border-radius', '12px')
      el.style.setProperty('margin-bottom', '20px')
    }

    // 处理预算项
    const budgetItems = exportContainer.querySelectorAll('.budget-item')
    budgetItems.forEach((item) => {
      const el = item as HTMLElement
      el.style.setProperty('background-color', '#f5f7fa')
      el.style.setProperty('padding', '16px')
      el.style.setProperty('border-radius', '8px')
      el.style.setProperty('margin-bottom', '12px')
    })

    // 添加到body(隐藏)
    exportContainer.style.position = 'absolute'
    exportContainer.style.left = '-9999px'
    document.body.appendChild(exportContainer)

    const canvas = await html2canvas(exportContainer, {
      backgroundColor: '#f5f7fa',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true
    })

    // 移除容器
    document.body.removeChild(exportContainer)

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210 // A4宽度(mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 如果内容高度超过一页,分页处理
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= 297 // A4高度

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
    }

    pdf.save(`旅行计划_${tripPlan.value?.cities?.join('_')}_${new Date().getTime()}.pdf`)

    message.success({ content: 'PDF导出成功!', key: 'export' })
  } catch (error: any) {
    console.error('导出PDF失败:', error)
    message.error({ content: `导出PDF失败: ${error.message}`, key: 'export' })
  }
}

// 截取地图图片
const captureMapImage = async () => {
  if (!map) return

  try {
    // 获取地图容器
    const mapContainer = document.getElementById('amap-container')
    if (!mapContainer) return

    // 使用高德地图的截图功能
    const mapCanvas = mapContainer.querySelector('canvas')
    if (mapCanvas) {
      // 创建一个img元素替换地图容器
      const img = document.createElement('img')
      img.src = mapCanvas.toDataURL('image/png')
      img.style.width = '100%'
      img.style.height = '500px'
      img.style.objectFit = 'cover'
      img.id = 'map-snapshot'

      // 隐藏原地图,显示截图
      mapContainer.style.display = 'none'
      mapContainer.parentElement?.appendChild(img)
    }
  } catch (error) {
    console.error('截取地图失败:', error)
  }
}

// 恢复地图
const restoreMap = () => {
  const mapContainer = document.getElementById('amap-container')
  const snapshot = document.getElementById('map-snapshot')

  if (mapContainer) {
    mapContainer.style.display = 'block'
  }

  if (snapshot) {
    snapshot.remove()
  }
}

// 计算地图默认中心点（根据目的地第一个有坐标的景点）
const getMapCenter = (): [number, number] => {
  if (!tripPlan.value) return [116.397128, 39.916527] // 默认北京

  for (const day of tripPlan.value.days) {
    for (const attr of day.attractions) {
      if (attr.location?.longitude && attr.location?.latitude) {
        return [attr.location.longitude, attr.location.latitude]
      }
    }
  }
  return [116.397128, 39.916527] // 兜底默认北京
}

// 初始化地图
const initMap = async () => {
  // 1. 前置检查：API Key 是否配置
  const amapKey = import.meta.env.VITE_AMAP_WEB_JS_KEY
  if (!amapKey || amapKey === 'your_amap_web_js_key_here') {
    mapLoadError.value = true
    mapErrorMessage.value = '未配置高德地图 JS API Key（VITE_AMAP_WEB_JS_KEY）'
    console.error('❌ 地图加载失败: 缺少 VITE_AMAP_WEB_JS_KEY 环境变量')
    return
  }

  mapLoading.value = true
  mapLoadError.value = false
  mapErrorMessage.value = ''

  try {
    const AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.Marker', 'AMap.Polyline', 'AMap.InfoWindow']
    })

    // 创建地图实例，使用动态中心点
    const center = getMapCenter()
    map = new AMap.Map('amap-container', {
      zoom: 12,
      center: center,
      viewMode: '3D'
    })

    // 添加景点标记
    addAttractionMarkers(AMap)

    mapLoading.value = false
    mapLoadError.value = false
    mapErrorMessage.value = ''
  } catch (error: any) {
    mapLoading.value = false
    mapLoadError.value = true
    console.error('地图加载失败:', error)

    // 2. 根据错误信息给出不同的提示
    const errMsg = error?.message || error?.toString() || ''
    if (errMsg.includes('INVALID_USER_KEY') || errMsg.includes('无效')) {
      mapErrorMessage.value = '高德地图 Key 无效，请检查是否已正确配置 VITE_AMAP_WEB_JS_KEY'
    } else if (errMsg.includes('key') && errMsg.includes('expired')) {
      mapErrorMessage.value = '高德地图 Key 已过期，请前往控制台续期'
    } else if (errMsg.includes('403') || errMsg.includes('Forbidden')) {
      mapErrorMessage.value = '高德地图 Key 权限不足，请确认已开启"Web端 JS API"服务'
    } else if (errMsg.includes('Network') || errMsg.includes('fetch') || errMsg.includes('timeout')) {
      mapErrorMessage.value = '网络连接失败，无法加载高德地图 SDK，请检查网络'
    } else {
      mapErrorMessage.value = `地图加载失败: ${errMsg.substring(0, 100)}`
    }
  }
}

// 重试加载地图
const retryLoadMap = async () => {
  mapRetrying.value = true
  try {
    await initMap()
  } finally {
    mapRetrying.value = false
  }
}

// 添加景点标记
const addAttractionMarkers = (AMap: any) => {
  if (!tripPlan.value) return

  const markers: any[] = []
  const allAttractions: any[] = []

  // 收集所有景点
  tripPlan.value.days.forEach((day, dayIndex) => {
    day.attractions.forEach((attraction, attrIndex) => {
      if (attraction.location && attraction.location.longitude && attraction.location.latitude) {
        allAttractions.push({
          ...attraction,
          dayIndex,
          attrIndex
        })
      }
    })
  })

  // 创建标记
  allAttractions.forEach((attraction, index) => {
    const marker = new AMap.Marker({
      position: [attraction.location.longitude, attraction.location.latitude],
      title: attraction.name,
      label: {
        content: `<div style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${index + 1}</div>`,
        offset: new AMap.Pixel(0, -30)
      }
    })

    // 创建信息窗口
    const infoWindow = new AMap.InfoWindow({
      content: `
        <div style="padding: 10px;">
          <h4 style="margin: 0 0 8px 0;">${attraction.name}</h4>
          <p style="margin: 4px 0;"><strong>地址:</strong> ${attraction.address}</p>
          <p style="margin: 4px 0;"><strong>游览时长:</strong> ${attraction.visit_duration}分钟</p>
          <p style="margin: 4px 0;"><strong>描述:</strong> ${attraction.description}</p>
          <p style="margin: 4px 0; color: #1890ff;"><strong>第${attraction.dayIndex + 1}天 景点${attraction.attrIndex + 1}</strong></p>
        </div>
      `,
      offset: new AMap.Pixel(0, -30)
    })

    // 点击标记显示信息窗口
    marker.on('click', () => {
      infoWindow.open(map, marker.getPosition())
    })

    markers.push(marker)
  })

  // 添加标记到地图
  map.add(markers)

  // 自动调整视野以包含所有标记
  if (allAttractions.length > 0) {
    map.setFitView(markers)
  }

  // 绘制路线
  drawRoutes(AMap, allAttractions)
}

// 绘制路线
const drawRoutes = (AMap: any, attractions: any[]) => {
  if (attractions.length < 2) return

  // 按天分组绘制路线
  const dayGroups: any = {}
  attractions.forEach(attr => {
    if (!dayGroups[attr.dayIndex]) {
      dayGroups[attr.dayIndex] = []
    }
    dayGroups[attr.dayIndex].push(attr)
  })

  // 为每天的景点绘制路线
  Object.values(dayGroups).forEach((dayAttractions: any) => {
    if (dayAttractions.length < 2) return

    const path = dayAttractions.map((attr: any) => [
      attr.location.longitude,
      attr.location.latitude
    ])

    const polyline = new AMap.Polyline({
      path: path,
      strokeColor: '#1890ff',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      showDir: true // 显示方向箭头
    })

    map.add(polyline)
  })
}
</script>

<style scoped>
.result-container {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding: var(--space-lg) 20px;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: fadeInDown 0.6s ease-out;
}

.back-button {
  border-radius: var(--radius-md);
  font-weight: 500;
}

/* 内容布局 */
.content-wrapper {
  max-width: 1280px;
  margin: 0 auto;
}

/* 摘要横幅 */
.summary-bar {
  margin-bottom: var(--space-lg);
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  gap: var(--space-lg);
}

.summary-icon { font-size: 28px; flex-shrink: 0; }

.summary-info { flex: 1; }

.summary-route {
  font-size: var(--font-heading-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

.summary-meta {
  font-size: var(--font-small);
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

.meta-sep { margin: 0 6px; color: var(--color-border); }

/* 预算迷你条形图 */
.summary-budget-bar {
  display: flex;
  height: 8px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--color-bg-hover);
  width: 200px;
  flex-shrink: 0;
}

.bar-segment { height: 100%; transition: width var(--transition-normal); }
.bar-attractions { background: #10b981; }
.bar-hotels { background: #3b82f6; }
.bar-meals { background: #f59e0b; }
.bar-transport { background: #8b5cf6; }
.bar-intercity { background: #ef4444; }

/* 主布局 */
.main-layout {
  display: flex;
  gap: var(--space-lg);
}

.side-nav { width: 200px; flex-shrink: 0; }

.nav-card {
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.nav-card :deep(.ant-menu) {
  border: none;
  border-radius: var(--radius-lg);
}

.main-content { flex: 1; min-width: 0; }

/* 分区卡片 */
.section-card {
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  font-size: var(--font-heading-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

/* 时间轴 */
.day-timeline { padding-left: 8px; }

.timeline-attr {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.timeline-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-brand-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-caption);
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-card {
  flex: 1;
  background: var(--color-bg-hover);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  border: 1px solid var(--color-border-light);
}

.tl-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tl-name { font-weight: 600; font-size: var(--font-body); }

.tl-duration {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  background: var(--color-bg-surface);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.tl-card-body {
  font-size: var(--font-small);
  color: var(--color-text-secondary);
  margin-top: 6px;
  line-height: var(--line-height-body);
}

.tl-card-tags { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }

.tl-card-notes {
  margin-top: 6px;
  font-size: var(--font-caption);
  color: var(--color-warning);
  background: var(--color-warning-bg);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.timeline-hotel {
  padding: 8px 12px;
  margin-left: 40px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border-radius: var(--radius-md);
  font-size: var(--font-small);
  color: var(--color-text-secondary);
}

/* Collapse header — 紧凑样式 */
.day-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.day-badge-sm {
  font-weight: 700;
  font-size: var(--font-body);
  color: var(--color-brand);
}

.day-city-tag {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  background: var(--color-bg-hover);
  padding: 1px 8px;
  border-radius: var(--radius-sm);
}

.day-date-sm {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.side-nav :deep(.ant-menu) {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  background: var(--color-bg-surface);
}

.side-nav :deep(.ant-menu-item) {
  margin: 4px 8px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.side-nav :deep(.ant-menu-item-selected) {
  background: var(--color-brand-gradient);
  color: white;
}

.side-nav :deep(.ant-menu-item:hover) {
  background: rgba(91, 76, 196, 0.06);
}

.main-content {
  flex: 1;
  min-width: 0;
}

/* 景点图片样式 */
.attraction-image-wrapper {
  position: relative;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.attraction-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.attraction-image-wrapper:hover .attraction-image {
  transform: scale(1.05);
}

.attraction-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.badge-number {
  font-size: 18px;
}

.price-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 77, 79, 0.9);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 天气卡片样式 */
.weather-card {
  background: #ecfdf5;
  border: 1px solid rgba(16, 185, 129, 0.15) !important;
  transition: box-shadow var(--transition-fast);
}

.weather-card:hover {
  box-shadow: var(--shadow-md);
}

.weather-date {
  font-size: var(--font-body);
  font-weight: 600;
  color: #065f46;
  margin-bottom: var(--space-sm);
  text-align: center;
}

.weather-info-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.weather-icon {
  font-size: 20px;
}

.weather-label {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.weather-value {
  font-size: var(--font-small);
  font-weight: 600;
  color: #065f46;
}

.weather-wind {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(16, 185, 129, 0.15);
  text-align: center;
  color: #065f46;
  font-size: var(--font-caption);
}

/* 回到顶部按钮 */
.back-top-button {
  width: 44px;
  height: 44px;
  background: var(--color-brand-gradient);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.back-top-button:hover {
  transform: scale(1.08);
  box-shadow: var(--shadow-lg);
}

/* 酒店卡片样式 */
.hotel-card {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border: none !important;
}

.hotel-title {
  font-weight: 600;
}

/* 顶部信息区布局 */
.top-info-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.left-info {
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-map {
  flex: 1;
}

/* 行程概览卡片 */
.overview-card {
  height: fit-content;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: var(--font-caption);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: var(--font-body);
  color: var(--color-text-primary);
  line-height: var(--line-height-body);
}

/* 预算卡片 */
.budget-card {
  height: fit-content;
}

.budget-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.budget-item {
  text-align: center;
  padding: var(--space-sm);
  background: var(--color-bg-hover);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.budget-label {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-xs);
}

.budget-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-brand);
}

.budget-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--color-brand-gradient);
  border-radius: var(--radius-md);
  color: white;
}

.total-label {
  font-size: var(--font-body);
  font-weight: 600;
}

.total-value {
  font-size: 22px;
  font-weight: 700;
}

/* 地图卡片 */
.map-card {
  height: 100%;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.map-card :deep(.ant-card-body) {
  flex: 1;
  height: 0;  /* flex子元素需要height:0才能由flex正确撑开 */
  padding: 0;
  overflow: hidden;
}

/* 地图包裹容器：作为覆盖层的定位参考 */
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 地图容器：始终渲染，始终有明确尺寸 */
.map-container {
  width: 100%;
  height: 100%;
  min-height: 450px;
}

/* 每日行程卡片 */
.days-card {
  margin-top: 20px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.day-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.day-date {
  font-size: 14px;
  color: #999;
}

.day-info {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  font-weight: 600;
  color: #666;
  min-width: 100px;
}

.info-row .value {
  color: #333;
  flex: 1;
}

/* 卡片样式优化 — 不再全局强制渐变标题 */
:deep(.ant-card) {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
  transition: box-shadow var(--transition-fast);
  animation: fadeInUp 0.6s ease-out;
}

:deep(.ant-card:hover) {
  box-shadow: var(--shadow-md);
}

:deep(.ant-card-head) {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  font-weight: 600;
}

/* 统计卡片样式 */
:deep(.ant-statistic-title) {
  font-size: var(--font-small);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-sm);
}

:deep(.ant-statistic-content) {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-brand);
}

/* 景点卡片样式 */
:deep(.ant-list-item) {
  transition: transform var(--transition-fast);
}

:deep(.ant-list-item:hover) {
  transform: scale(1.01);
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 看板视图 */
.kanban-view {
  margin-top: var(--space-lg);
}

.kanban-toolbar {
  margin-bottom: var(--space-md);
}

.kanban-columns {
  display: flex;
  gap: var(--space-md);
  overflow-x: auto;
  padding-bottom: var(--space-md);
}

/* 可编辑景点列表 */
.editable-attractions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-container {
    padding: var(--space-md) 10px;
  }

  .page-header {
    flex-direction: column;
    gap: var(--space-md);
  }

  .content-wrapper {
    flex-direction: column;
  }

  .side-nav {
    width: 100%;
  }

  .top-info-section {
    flex-direction: column;
  }

  .left-info {
    flex: none;
    width: 100%;
  }
}

/* 跨城交通方案 */
.transport-card {
  height: fit-content;
}
.transport-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.transport-item {
  padding: var(--space-md);
  background: var(--color-info-bg);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(59, 130, 246, 0.15);
  transition: box-shadow var(--transition-fast);
}
.transport-item:hover {
  box-shadow: var(--shadow-sm);
}
.transport-route {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: var(--font-heading-sm);
  font-weight: 600;
}
.transport-from, .transport-to {
  color: var(--color-text-primary);
}
.transport-arrow {
  color: var(--color-brand);
  font-size: 18px;
}
.transport-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.transport-duration {
  color: #666;
  font-size: 14px;
}
.transport-cost {
  color: #ff4d4f;
  font-weight: 600;
  font-size: 15px;
}
.transport-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #888;
  line-height: 1.5;
}

/* ========== 地图错误降级 UI（覆盖层） ========== */
.map-error-fallback {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
  z-index: 10;
  overflow-y: auto;
}

.map-error-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.map-error-title {
  font-size: 20px;
  font-weight: 600;
  color: #ff4d4f;
  margin-bottom: 8px;
}

.map-error-reason {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  padding: 8px 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  max-width: 500px;
}

.map-error-tips {
  text-align: left;
  font-size: 13px;
  color: #555;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  max-width: 500px;
  line-height: 1.8;
}

.map-error-tips p {
  margin: 0 0 6px 0;
}

.map-error-tips ul,
.map-error-tips ol {
  margin: 4px 0 12px 0;
  padding-left: 20px;
}

.map-error-tips code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #d4380d;
}

/* ========== 地图加载中状态（覆盖层） ========== */
.map-loading-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
  z-index: 5;
}

.map-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e8e8e8;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.map-loading-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.map-loading-sub {
  font-size: 13px;
  color: #999;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>

