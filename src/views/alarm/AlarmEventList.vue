<template>
  <div class="alarm-event-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>报警事件查询</h2>
      <p class="page-description">查看设备上报的报警事件记录</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stat-item">
            <div class="stat-icon today">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.today }}</div>
              <div class="stat-label">今日报警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stat-item">
            <div class="stat-icon week">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.week }}</div>
              <div class="stat-label">本周报警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stat-item">
            <div class="stat-icon month">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.month }}</div>
              <div class="stat-label">本月报警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总计</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="设备ID">
          <el-input
            v-model="filters.device_id"
            placeholder="请输入设备ID"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="通道ID">
          <el-input
            v-model="filters.channel_id"
            placeholder="请输入通道ID"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="报警级别">
          <el-select v-model="filters.level" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" :value="null" />
            <el-option label="1级" :value="1" />
            <el-option label="2级" :value="2" />
            <el-option label="3级" :value="3" />
            <el-option label="4级" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="报警方式">
          <el-select v-model="filters.method" placeholder="全部" clearable style="width: 150px">
            <el-option label="全部" :value="null" />
            <el-option label="电话报警" :value="1" />
            <el-option label="设备报警" :value="2" />
            <el-option label="短信报警" :value="3" />
            <el-option label="GPS 报警" :value="4" />
            <el-option label="视频报警" :value="5" />
            <el-option label="设备故障报警" :value="6" />
            <el-option label="其他报警" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList" :icon="Search">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="alarm_time" label="报警时间" width="180" />
        <el-table-column prop="device_id" label="设备ID" width="160" show-overflow-tooltip />
        <el-table-column prop="channel_id" label="通道ID" width="160" show-overflow-tooltip />
        <el-table-column prop="level" label="级别" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="ALARM_LEVEL_CONFIG[row.level]?.type || 'info'">
              {{ row.level_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方式" width="100" align="center">
          <template #default="{ row }">
            {{ ALARM_METHOD_CONFIG[row.method] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="报警类型" width="150" align="center">
          <template #default="{ row }">
            {{ getAlarmTypeName(row.method, row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="alarm_plan_id" label="关联预案" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.alarm_plan_id" type="success" size="small">已触发</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDialogVisible"
      title="报警事件详情"
      size="600px"
      class="alarm-detail-drawer"
    >
      <div v-if="currentEvent" class="detail-content">
        <el-descriptions
          :column="2"
          border
          class="alarm-detail-descriptions"
        >
          <el-descriptions-item label="事件ID">
            {{ currentEvent.id }}
          </el-descriptions-item>
          <el-descriptions-item label="报警级别">
            <el-tag :type="ALARM_LEVEL_CONFIG[currentEvent.level]?.type || 'info'">
              {{ ALARM_LEVEL_CONFIG[currentEvent.level]?.label || currentEvent.level }}级
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="报警方式">
            {{ ALARM_METHOD_CONFIG[currentEvent.method] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="报警类型">
            {{ getAlarmTypeName(currentEvent.method, currentEvent.type) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentEvent.method === 5 && currentEvent.type === 6" label="事件类型">
            {{ EVENT_TYPE_CONFIG[currentEvent.eventtype!] || currentEvent.eventtype }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentEvent.alarm_plan_id" label="关联预案">
            <el-tag type="success">已触发预案 #{{ currentEvent.alarm_plan_id }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备ID" :span="2">
            {{ currentEvent.device_id }}
          </el-descriptions-item>
          <el-descriptions-item label="通道ID" :span="2">
            {{ currentEvent.channel_id }}
          </el-descriptions-item>
          <el-descriptions-item label="报警时间" :span="2">
            {{ currentEvent.alarm_time }}
          </el-descriptions-item>
          <el-descriptions-item label="接收时间" :span="2">
            {{ currentEvent.recv_time }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ currentEvent.description }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentEvent.longitude" label="位置" :span="2">
            <el-link
              type="primary"
              :href="`https://uri.amap.com/marker?position=${currentEvent.longitude},${currentEvent.latitude}&name=报警位置`"
              target="_blank"
            >
              {{ currentEvent.longitude }}, {{ currentEvent.latitude }}
            </el-link>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 报警资源 -->
        <div v-if="currentEvent.assets" class="alarm-assets-section">
          <el-divider content-position="left">报警资源</el-divider>

          <!-- 快照 -->
          <div v-if="currentEvent.assets.snapshots && currentEvent.assets.snapshots.length > 0" class="assets-group">
            <div class="assets-title">
              <el-icon><Camera /></el-icon>
              <span>报警快照 ({{ currentEvent.assets.snapshots.length }})</span>
            </div>
            <div class="assets-grid">
              <div
                v-for="snapshot in currentEvent.assets.snapshots"
                :key="snapshot.id"
                class="asset-item"
              >
                <el-image
                  :src="snapshot.file_url"
                  fit="cover"
                  class="asset-image"
                  :preview-src-list="currentEvent.assets.snapshots.map(s => s.file_url)"
                  :initial-index="currentEvent.assets.snapshots.indexOf(snapshot)"
                  preview-teleported
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
                <div class="asset-time">{{ snapshot.shot_time }}</div>
              </div>
            </div>
          </div>

          <!-- 录像 -->
          <div v-if="currentEvent.assets.records && currentEvent.assets.records.length > 0" class="assets-group">
            <div class="assets-title">
              <el-icon><VideoCamera /></el-icon>
              <span>报警录像 ({{ currentEvent.assets.records.length }})</span>
            </div>
            <div class="records-list">
              <div
                v-for="record in currentEvent.assets.records"
                :key="record.id"
                class="record-item"
              >
                <el-icon class="record-icon"><VideoPlay /></el-icon>
                <div class="record-info">
                  <div class="record-time">{{ record.start_time }}</div>
                  <div class="record-duration">时长: {{ formatDuration(record.duration) }}</div>
                </div>
                <el-button type="primary" link size="small" @click="playRecord(record.file_url)">
                  播放
                </el-button>
              </div>
            </div>
          </div>

          <div
            v-if="(!currentEvent.assets.snapshots || currentEvent.assets.snapshots.length === 0) &&
              (!currentEvent.assets.records || currentEvent.assets.records.length === 0)"
            class="no-assets"
          >
            <el-empty description="暂无报警资源" :image-size="80" />
          </div>
        </div>

        <!-- 原始报文 -->
        <div v-if="currentEvent.raw_payload" class="raw-payload-section">
          <el-divider content-position="left">原始报文</el-divider>
          <div class="raw-payload-content">
            <pre class="raw-payload-code">{{ formatRawPayload(currentEvent.raw_payload) }}</pre>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
// @ts-ignore
import { Search, Calendar, DataLine, Camera, Picture, VideoCamera, VideoPlay } from '@element-plus/icons-vue'
import { alarmApi } from '@/api/alarmApi'
import type { AlarmEvent, AlarmEventQueryParams } from '@/types/alarm'
import { ALARM_LEVEL_CONFIG, ALARM_METHOD_CONFIG, getAlarmTypeName, EVENT_TYPE_CONFIG, type AlarmSummary } from '@/types/alarm'

/* ================= 状态 ================= */

const loading = ref(false)
const list = ref<AlarmEvent[]>([])

const filters = reactive<AlarmEventQueryParams>({
  device_id: '',
  channel_id: '',
  level: null,
  method: null
})

const dateRange = ref<[string, string] | []>([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const stats = reactive<AlarmSummary>({
  today: 0,
  week: 0,
  month: 0,
  total: 0
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentEvent = ref<AlarmEvent>()

/* ================= 方法 ================= */

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const params: AlarmEventQueryParams = {
      page: pagination.page,
      page_size: pagination.pageSize
    }

    if (filters.device_id) params.device_id = filters.device_id
    if (filters.channel_id) params.channel_id = filters.channel_id
    if (filters.level !== null && filters.level !== undefined) params.level = filters.level
    if (filters.method !== null && filters.method !== undefined) params.method = filters.method

    // 时间范围 - 使用新的 start_time/end_time 参数
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_time = dateRange.value[0]
      params.end_time = dateRange.value[1]
    }

    const data = await alarmApi.getAlarmEvents(params)
    list.value = data.list || []
    pagination.total = data.total || data.paginator?.total || 0

    // 更新统计数据
    if (data.summary) {
      Object.assign(stats, data.summary)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilters = () => {
  filters.device_id = ''
  filters.channel_id = ''
  filters.level = null
  filters.method = null
  dateRange.value = []
  pagination.page = 1
  loadList()
}

// 加载统计数据
const loadStats = async () => {
  try {
    // 尝试使用专门的统计 API
    const data = await alarmApi.getAlarmStats()
    if (data) {
      Object.assign(stats, data)
    }
  } catch (error: any) {
    // 如果专门的统计 API 不可用，从 list 接口获取 summary
    console.warn('统计 API 不可用，从列表接口获取统计数据')
    try {
      const data = await alarmApi.getAlarmEvents({ page: 1, page_size: 1 })
      if (data.summary) {
        Object.assign(stats, data.summary)
      }
    } catch (listError: any) {
      console.error('加载统计数据失败:', listError)
    }
  }
}

// 显示详情
const showDetail = async (row: AlarmEvent) => {
  currentEvent.value = row
  detailDialogVisible.value = true

  // 如果没有资产数据，尝试获取详情
  if (!row.assets && row.id) {
    try {
      const eventDetail = await alarmApi.getAlarmEventDetail(row.id)
      if (eventDetail) {
        currentEvent.value = eventDetail
      }
    } catch (error: any) {
      console.error('获取报警详情失败:', error)
    }
  }
}

// 格式化时长
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}

// 播放录像
const playRecord = (url: string) => {
  // TODO: 打开录像播放器
  window.open(url, '_blank')
}

// 格式化原始报文
const formatRawPayload = (payload: string): string => {
  try {
    // 尝试解析为 JSON 并格式化
    const parsed = JSON.parse(payload)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // 如果不是 JSON，直接返回原文
    return payload
  }
}

/* ================= 生命周期 ================= */

onMounted(() => {
  loadList()
  loadStats()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.alarm-event-page {
  padding: 16px;
  background: var(--bg-main);
  min-height: 100%;
}

.page-header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 500;
    color: var(--text-main);
  }

  .page-description {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }
}

.stats-row {
  margin-bottom: 16px;

  .stats-card {
    .stat-item {
      display: flex;
      align-items: center;

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;

        :deep(.el-icon) {
          font-size: 24px;
          color: #fff;
        }

        &.today {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.week {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.month {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.total {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-main);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }
      }
    }
  }
}

.filter-card {
  margin-bottom: 16px;

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin: 0;

    :deep(.el-form-item) {
      margin-bottom: 8px;
    }
  }
}

.table-card {
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}

.text-muted {
  color: var(--text-muted);
}

.alarm-detail-descriptions {
  margin-bottom: 16px;
}

.alarm-assets-section {
  .assets-group {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .assets-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
    margin-bottom: 12px;

    .el-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .assets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .asset-item {
    position: relative;

    .asset-image {
      width: 100%;
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border-base);

      :deep(.el-image__inner) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .image-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: var(--bg-light);
      color: var(--text-muted);
      font-size: 12px;

      .el-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }
    }

    .asset-time {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 11px;
      border-radius: 0 0 8px 8px;
    }
  }

  .records-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .record-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: var(--bg-light);
    border-radius: 8px;
    border: 1px solid var(--border-base);

    .record-icon {
      font-size: 24px;
      color: var(--el-color-primary);
      margin-right: 12px;
    }

    .record-info {
      flex: 1;

      .record-time {
        font-size: 14px;
        color: var(--text-main);
        margin-bottom: 4px;
      }

      .record-duration {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  }

  .no-assets {
    padding: 20px 0;
  }
}

.raw-payload-section {
  margin-top: 24px;
}

.raw-payload-content {
  .raw-payload-code {
    margin: 0;
    padding: 16px;
    background: var(--bg-light);
    border: 1px solid var(--border-base);
    border-radius: 8px;
    font-size: 12px;
    font-family: 'Courier New', Consolas, Monaco, monospace;
    color: var(--text-main);
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
    line-height: 1.5;
  }
}

.detail-content {
  padding-bottom: 20px;
}
</style>
