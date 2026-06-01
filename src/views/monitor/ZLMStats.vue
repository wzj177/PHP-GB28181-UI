<template>
  <div class="zlm-stats-container">
    <div class="page-header">
      <h2>ZLMediaKit 流媒体网关</h2>
      <div class="header-actions">
        <el-button
          :loading="loading"
          @click="refreshData"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="stats-content">
      <!-- Server Status -->
      <el-card class="stats-card status-card">
        <template #header>
          <div class="card-title">
            <el-icon><Monitor /></el-icon>
            <span>服务状态</span>
          </div>
        </template>
        <div class="status-info">
          <div class="status-main">
            <el-tag
              :type="zlmStats.running ? 'success' : 'danger'"
              size="large"
              effect="dark"
            >
              {{ zlmStats.running ? '运行中' : '已停止' }}
            </el-tag>
            <div
              v-if="zlmStats.running"
              class="uptime"
            >
              运行时间: {{ formatUptime(zlmStats.uptime) }}
            </div>
          </div>
          <div class="status-details">
            <div class="detail-item">
              <span class="detail-label">版本:</span>
              <span class="detail-value">{{ zlmStats.version || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">编译时间:</span>
              <span class="detail-value">{{ zlmStats.build_date || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Git 提交:</span>
              <span class="detail-value code">{{ zlmStats.git_hash || '-' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Stream Stats -->
      <el-card class="stats-card">
        <template #header>
          <div class="card-title">
            <el-icon><VideoPlay /></el-icon>
            <span>流统计</span>
          </div>
        </template>
        <div class="stream-stats">
          <div class="stat-box">
            <div class="stat-icon live">
              <el-icon><VideoPlay /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">
                直播流
              </div>
              <div class="stat-value">
                {{ zlmStats.stream_count || 0 }}
              </div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-icon record">
              <el-icon><Film /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">
                录像流
              </div>
              <div class="stat-value">
                {{ zlmStats.record_stream_count || 0 }}
              </div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-icon other">
              <el-icon><Files /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">
                其他流
              </div>
              <div class="stat-value">
                {{ zlmStats.other_stream_count || 0 }}
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Connection Stats -->
      <el-card class="stats-card">
        <template #header>
          <div class="card-title">
            <el-icon><Connection /></el-icon>
            <span>连接统计</span>
          </div>
        </template>
        <div class="connection-stats">
          <div class="stat-row">
            <div class="stat-item">
              <span class="label">会话数:</span>
              <span class="value">{{ zlmStats.session_count || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">TCP 连接:</span>
              <span class="value">{{ zlmStats.tcp_connection_count || 0 }}</span>
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-item">
              <span class="label">UDP 连接:</span>
              <span class="value">{{ zlmStats.udp_connection_count || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">累计连接:</span>
              <span class="value">{{ zlmStats.total_connection_count || 0 }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Bandwidth Stats -->
      <el-card class="stats-card full-width">
        <template #header>
          <div class="card-title">
            <el-icon><TrendCharts /></el-icon>
            <span>带宽统计</span>
          </div>
        </template>
        <div class="bandwidth-stats">
          <div class="bandwidth-item">
            <div class="bandwidth-label">
              总带宽
            </div>
            <div class="bandwidth-value primary">
              {{ formatSpeed(zlmStats.total_bandwidth) }}
            </div>
          </div>
          <div class="bandwidth-grid">
            <div class="bandwidth-box">
              <div class="box-label">
                RTSP
              </div>
              <div class="box-value">
                {{ formatSpeed(zlmStats.rtsp_bandwidth) }}
              </div>
            </div>
            <div class="bandwidth-box">
              <div class="box-label">
                HTTP-FLV
              </div>
              <div class="box-value">
                {{ formatSpeed(zlmStats.http_flv_bandwidth) }}
              </div>
            </div>
            <div class="bandwidth-box">
              <div class="box-label">
                WS-FLV
              </div>
              <div class="box-value">
                {{ formatSpeed(zlmStats.ws_flv_bandwidth) }}
              </div>
            </div>
            <div class="bandwidth-box">
              <div class="box-label">
                HLS
              </div>
              <div class="box-value">
                {{ formatSpeed(zlmStats.hls_bandwidth) }}
              </div>
            </div>
            <div class="bandwidth-box">
              <div class="box-label">
                RTMP
              </div>
              <div class="box-value">
                {{ formatSpeed(zlmStats.rtmp_bandwidth) }}
              </div>
            </div>
            <div class="bandwidth-box">
              <div class="box-label">
                WebSocket
              </div>
              <div class="box-value">
                {{ formatSpeed(zlmStats.websocket_bandwidth) }}
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Performance Stats -->
      <el-card class="stats-card full-width">
        <template #header>
          <div class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            <span>性能指标</span>
          </div>
        </template>
        <div class="performance-stats">
          <div class="performance-item">
            <div class="perf-label">
              CPU 使用率
            </div>
            <div class="perf-bar">
              <el-progress
                :percentage="zlmStats.cpu_usage || 0"
                :color="getProgressColor(zlmStats.cpu_usage || 0)"
              />
            </div>
          </div>
          <div class="performance-item">
            <div class="perf-label">
              内存使用率
            </div>
            <div class="perf-bar">
              <el-progress
                :percentage="zlmStats.memory_usage || 0"
                :color="getProgressColor(zlmStats.memory_usage || 0)"
              />
            </div>
          </div>
          <div class="performance-item">
            <div class="perf-label">
              线程数
            </div>
            <div class="perf-value">
              {{ zlmStats.thread_count || 0 }}
            </div>
          </div>
          <div class="performance-item">
            <div class="perf-label">
              数据缓冲区
            </div>
            <div class="perf-value">
              {{ formatBytes(zlmStats.data_buffer_size) }}
            </div>
          </div>
        </div>
      </el-card>

      <!-- Media Codec Info -->
      <el-card class="stats-card full-width">
        <template #header>
          <div class="card-title">
            <el-icon><Setting /></el-icon>
            <span>编解码支持</span>
          </div>
        </template>
        <div class="codec-info">
          <div class="codec-section">
            <div class="section-title">
              视频编解码
            </div>
            <div class="codec-list">
              <el-tag
                v-for="codec in zlmStats.video_codecs"
                :key="codec"
                type="success"
                size="small"
              >
                {{ codec }}
              </el-tag>
            </div>
          </div>
          <div class="codec-section">
            <div class="section-title">
              音频编解码
            </div>
            <div class="codec-list">
              <el-tag
                v-for="codec in zlmStats.audio_codecs"
                :key="codec"
                type="info"
                size="small"
              >
                {{ codec }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Refresh, Monitor, VideoPlay, Film, Files, Connection, TrendCharts,
  DataAnalysis, Setting
// @ts-ignore
} from '@element-plus/icons-vue'
import { monitorApi } from '@/api/monitorApi'
import { ElMessage } from 'element-plus'

const loading = ref(false)

const zlmStats = ref({
  running: false,
  version: '',
  build_date: '',
  git_hash: '',
  uptime: 0,
  stream_count: 0,
  record_stream_count: 0,
  other_stream_count: 0,
  session_count: 0,
  tcp_connection_count: 0,
  udp_connection_count: 0,
  total_connection_count: 0,
  total_bandwidth: 0,
  rtsp_bandwidth: 0,
  http_flv_bandwidth: 0,
  ws_flv_bandwidth: 0,
  hls_bandwidth: 0,
  rtmp_bandwidth: 0,
  websocket_bandwidth: 0,
  cpu_usage: 0,
  memory_usage: 0,
  thread_count: 0,
  data_buffer_size: 0,
  video_codecs: [] as string[],
  audio_codecs: [] as string[]
})

let refreshTimer: number | null = null

const getProgressColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const formatSpeed = (bytes: number): string => {
  if (!bytes) return '0 B/s'
  return formatBytes(bytes) + '/s'
}

const formatUptime = (seconds: number): string => {
  if (!seconds) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

const fetchZLMStats = async () => {
  try {
    loading.value = true
    const response: any = await monitorApi.getZLMediaKitStats()
    if (response.data) {
      zlmStats.value = {
        running: response.data.running ?? true,
        version: response.data.version || '',
        build_date: response.data.build_date || '',
        git_hash: response.data.git_hash || '',
        uptime: response.data.uptime || 0,
        stream_count: response.data.stream_count || 0,
        record_stream_count: response.data.record_stream_count || 0,
        other_stream_count: response.data.other_stream_count || 0,
        session_count: response.data.session_count || 0,
        tcp_connection_count: response.data.tcp_connection_count || 0,
        udp_connection_count: response.data.udp_connection_count || 0,
        total_connection_count: response.data.total_connection_count || 0,
        total_bandwidth: response.data.total_bandwidth || 0,
        rtsp_bandwidth: response.data.rtsp_bandwidth || 0,
        http_flv_bandwidth: response.data.http_flv_bandwidth || 0,
        ws_flv_bandwidth: response.data.ws_flv_bandwidth || 0,
        hls_bandwidth: response.data.hls_bandwidth || 0,
        rtmp_bandwidth: response.data.rtmp_bandwidth || 0,
        websocket_bandwidth: response.data.websocket_bandwidth || 0,
        cpu_usage: response.data.cpu_usage || 0,
        memory_usage: response.data.memory_usage || 0,
        thread_count: response.data.thread_count || 0,
        data_buffer_size: response.data.data_buffer_size || 0,
        video_codecs: response.data.video_codecs || ['H264', 'H265'],
        audio_codecs: response.data.audio_codecs || ['AAC', 'PCMU', 'PCMA']
      }
    }
  } catch (error) {
    console.error('获取 ZLMediaKit 状态失败:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await fetchZLMStats()
  ElMessage.success('数据已刷新')
}

onMounted(() => {
  fetchZLMStats()
  // 每 30 秒自动刷新
  refreshTimer = window.setInterval(() => {
    fetchZLMStats()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.zlm-stats-container {
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
        gap: 8px;
        font-weight: 500;
        color: var(--text-main);

        .el-icon {
          color: $primary;
        }
      }
    }

    .status-card {
      .status-info {
        .status-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;

          .uptime {
            margin-top: 12px;
            color: var(--text-muted);
            font-size: 14px;
          }
        }

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 14px;
            background: var(--bg-hover);
            border-radius: $radius-base;

            .detail-label {
              color: var(--text-muted);
              font-size: 14px;
            }

            .detail-value {
              color: var(--text-main);
              font-size: 14px;
              font-weight: 500;

              &.code {
                font-family: monospace;
                font-size: 12px;
              }
            }
          }
        }
      }
    }

    .stream-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      .stat-box {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--bg-hover);
        border-radius: $radius-base;

        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 20px;

          &.live {
            background: rgba($success, 0.15);
            color: $success;
          }

          &.record {
            background: rgba($primary, 0.15);
            color: $primary;
          }

          &.other {
            background: rgba($info, 0.15);
            color: $info;
          }
        }

        .stat-info {
          flex: 1;

          .stat-label {
            color: var(--text-muted);
            font-size: 13px;
            margin-bottom: 4px;
          }

          .stat-value {
            color: var(--text-main);
            font-size: 22px;
            font-weight: 600;
          }
        }
      }
    }

    .connection-stats {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .stat-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;

        .stat-item {
          padding: 14px 16px;
          background: var(--bg-hover);
          border-radius: $radius-base;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .label {
            color: var(--text-muted);
            font-size: 14px;
          }

          .value {
            color: var(--text-main);
            font-size: 18px;
            font-weight: 600;
          }
        }
      }
    }

    .bandwidth-stats {
      .bandwidth-item {
        text-align: center;
        margin-bottom: 20px;
        padding: 20px;
        background: var(--bg-hover);
        border-radius: $radius-base;

        .bandwidth-label {
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .bandwidth-value {
          font-size: 36px;
          font-weight: 700;

          &.primary {
            color: $primary;
          }
        }
      }

      .bandwidth-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;

        .bandwidth-box {
          padding: 14px;
          background: var(--bg-hover);
          border-radius: $radius-base;
          text-align: center;

          .box-label {
            color: var(--text-muted);
            font-size: 12px;
            margin-bottom: 6px;
          }

          .box-value {
            color: var(--text-main);
            font-size: 16px;
            font-weight: 500;
          }
        }
      }
    }

    .performance-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      .performance-item {
        padding: 14px 16px;
        background: var(--bg-hover);
        border-radius: $radius-base;

        .perf-label {
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 10px;
        }

        .perf-bar {
          :deep(.el-progress) {
            .el-progress__text {
              font-size: 14px !important;
            }
          }
        }

        .perf-value {
          color: var(--text-main);
          font-size: 20px;
          font-weight: 600;
        }
      }
    }

    .codec-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      .codec-section {
        .section-title {
          color: var(--text-main);
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .codec-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    }
  }
}

@media (max-width: $breakpoint-md) {
  .stats-content {
    grid-template-columns: 1fr !important;
  }

  .stream-stats {
    grid-template-columns: 1fr !important;
  }

  .performance-stats {
    grid-template-columns: 1fr !important;
  }

  .codec-info {
    grid-template-columns: 1fr !important;
  }
}
</style>
