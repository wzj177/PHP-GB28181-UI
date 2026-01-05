<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ElCard,
  ElButton,
  ElTable,
  ElTableColumn,
  ElMessage,
  ElTag
} from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import { gb28181Api } from '@/api/gb28181Api'

// Define recording interface
interface Recording {
  id: string
  deviceId: string
  channelId: string
  startTime: string
  endTime: string
  duration: number // in minutes
  fileSize: string
  type: 'motion' | 'manual' | 'schedule'
}

const route = useRoute()
const deviceId = ref(route.params.deviceId as string)
const recordings = ref<Recording[]>([])
const loading = ref(false)

// Load recordings
onMounted(() => {
  loadRecordings()
})

const loadRecordings = async () => {
  if (!deviceId.value) {
    console.log('⚠️ No deviceId, skipping loadRecordings')
    return
  }

  loading.value = true
  try {
    // Get the current date range (e.g., last 24 hours)
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - 1) // Last 24 hours
    const endTime = new Date()

    const params = {
      device_id: deviceId.value,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    }

    console.log('📼 Fetching recordings with params:', params)

    const response = await gb28181Api.getRecordings(params)

    console.log('📼 API response:', response)
    console.log('📼 response.list:', response?.list)

    if (response?.list) {
      recordings.value = response.list || []
      console.log('Recordings loaded successfully:', recordings.value.length, 'items')
    } else {
      console.error('❌ API returned non-zero code:', response?.code, response?.message)
      throw new Error(response?.message || '获取录像列表失败')
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch recordings:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    })
    ElMessage.error(error.message || '获取录像列表失败')
  } finally {
    loading.value = false
  }
}

// Get recording type label
const getRecordingTypeLabel = (type: string) => {
  switch (type) {
    case 'motion': return '移动侦测'
    case 'manual': return '手动录像'
    case 'schedule': return '计划录像'
    default: return '未知类型'
  }
}

// Get recording type tag type
const getRecordingTypeTagType = (type: string) => {
  switch (type) {
    case 'motion': return 'warning'
    case 'manual': return 'primary'
    case 'schedule': return 'success'
    default: return 'info'
  }
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// Download recording
const downloadRecording = async (recordingId: string) => {
  try {
    const response = await gb28181Api.downloadRecording(recordingId);

    if (response) {
      // Create a blob from the response and trigger download
      const blob = new Blob([response], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_${recordingId}.mp4`; // Set appropriate filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      ElMessage.success('下载开始');
    } else {
      ElMessage.error('下载失败');
    }
  } catch (error: any) {
    console.error('Failed to download recording:', error);
    ElMessage.error(error.message || '下载失败');
  }
}
</script>

<template>
  <div class="recordings-list-container">
    <div class="page-header">
      <h2>录像列表</h2>
      <div class="header-actions">
        <el-button
          :loading="loading"
          @click="loadRecordings"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="stats-content">
      <!-- Recordings list -->
      <ElCard class="stats-card full-width">
        <template #header>
          <div class="card-title">
            <span>录像记录</span>
          </div>
        </template>

        <ElTable
          v-loading="loading"
          :data="recordings"
          style="width: 100%"
        >
          <ElTableColumn
            prop="startTime"
            label="开始时间"
            width="180"
          >
            <template #default="{ row }">
              {{ formatDate(row.startTime) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            prop="endTime"
            label="结束时间"
            width="180"
          >
            <template #default="{ row }">
              {{ formatDate(row.endTime) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            prop="duration"
            label="时长(分钟)"
            width="120"
          />
          <ElTableColumn
            prop="fileSize"
            label="文件大小"
            width="120"
          />
          <ElTableColumn
            label="类型"
            width="120"
          >
            <template #default="{ row }">
              <ElTag :type="getRecordingTypeTagType(row.type)">
                {{ getRecordingTypeLabel(row.type) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="操作"
            width="120"
          >
            <template #default="{ row }">
              <ElButton
                size="small"
                :icon="Download"
                @click="downloadRecording(row.id)"
              >
                下载
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.recordings-list-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: $spacing-md;
    background: var(--bg-panel);
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);

    h2 {
      margin: 0;
      color: var(--text-main);
      font-size: 18px;
      font-weight: 600;
    }
  }

  .stats-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 16px;

    .stats-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-base);
      border-radius: $radius-panel;

      &.full-width {
        grid-column: 1 / -1;
      }

      :deep(.el-card__header) {
        background: var(--bg-hover);
        border-bottom: 1px solid var(--border-base);
        padding: 12px 16px;
      }

      :deep(.el-card__body) {
        padding: 16px;
      }

      .card-title {
        display: flex;
        align-items: center;
        font-weight: 500;
        color: var(--text-main);
      }
    }
  }
}
</style>