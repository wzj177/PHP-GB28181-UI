<template>
  <div class="system-stats-container">
    <div class="page-header">
      <h2>系统统计</h2>
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
      <!-- CPU Stats -->
      <el-card class="stats-card">
        <template #header>
          <div class="card-title">
            <el-icon><ZoomIn /></el-icon>
            <span>CPU 使用率</span>
          </div>
        </template>
        <div class="stats-detail">
          <div class="stats-chart">
            <el-progress
              type="dashboard"
              :percentage="systemStats.cpu_usage"
              :color="getProgressColor(systemStats.cpu_usage)"
              :width="160"
            >
              <template #default="{ percentage }">
                <span class="progress-value">{{ percentage }}%</span>
              </template>
            </el-progress>
          </div>
          <div class="stats-info">
            <div class="info-item">
              <span class="info-label">核心数:</span>
              <span class="info-value">{{ systemStats.cpu_cores || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">频率:</span>
              <span class="info-value">{{ systemStats.cpu_frequency || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- CPU 负载进度条 -->
        <div class="cpu-load-section">
          <div class="load-item">
            <div class="load-header">
              <span class="load-label">1分钟负载</span>
              <span class="load-value">{{ systemStats.cpu_load.load1 }} / {{ systemStats.cpu_cores }} 核心</span>
            </div>
            <el-progress
              :percentage="systemStats.cpu_load.load1_percent"
              :color="getLoadColor(systemStats.cpu_load.load1_percent)"
              :stroke-width="12"
            />
          </div>
          <div class="load-item">
            <div class="load-header">
              <span class="load-label">5分钟负载</span>
              <span class="load-value">{{ systemStats.cpu_load.load5 }}</span>
            </div>
            <el-progress
              :percentage="systemStats.cpu_load.load5_percent"
              :color="getLoadColor(systemStats.cpu_load.load5_percent)"
              :stroke-width="12"
            />
          </div>
          <div class="load-item">
            <div class="load-header">
              <span class="load-label">15分钟负载</span>
              <span class="load-value">{{ systemStats.cpu_load.load15 }}</span>
            </div>
            <el-progress
              :percentage="systemStats.cpu_load.load15_percent"
              :color="getLoadColor(systemStats.cpu_load.load15_percent)"
              :stroke-width="12"
            />
          </div>
        </div>
      </el-card>

      <!-- Memory Stats -->
      <el-card class="stats-card">
        <template #header>
          <div class="card-title">
            <el-icon><Delete /></el-icon>
            <span>内存使用率</span>
          </div>
        </template>
        <div class="stats-detail">
          <div class="stats-chart">
            <el-progress
              type="dashboard"
              :percentage="systemStats.memory_usage"
              :color="getProgressColor(systemStats.memory_usage)"
              :width="160"
            >
              <template #default="{ percentage }">
                <span class="progress-value">{{ percentage }}%</span>
              </template>
            </el-progress>
          </div>
          <div class="stats-info">
            <div class="info-item">
              <span class="info-label">总内存:</span>
              <span class="info-value">{{ systemStats.memory_total || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">已使用:</span>
              <span class="info-value">{{ systemStats.memory_used || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">可用:</span>
              <span class="info-value">{{ systemStats.memory_free || '-' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Disk Stats -->
      <el-card class="stats-card">
        <template #header>
          <div class="card-title">
            <el-icon><Location /></el-icon>
            <span>磁盘使用率</span>
          </div>
        </template>
        <div class="stats-detail">
          <div class="stats-chart">
            <el-progress
              type="dashboard"
              :percentage="systemStats.disk_usage"
              :color="getProgressColor(systemStats.disk_usage)"
              :width="160"
            >
              <template #default="{ percentage }">
                <span class="progress-value">{{ percentage }}%</span>
              </template>
            </el-progress>
          </div>
          <div class="stats-info">
            <div class="info-item">
              <span class="info-label">总容量:</span>
              <span class="info-value">{{ systemStats.disk_total || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">已使用:</span>
              <span class="info-value">{{ systemStats.disk_used || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">可用:</span>
              <span class="info-value">{{ systemStats.disk_free || '-' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Network Stats -->
      <el-card class="stats-card">
        <template #header>
          <div class="card-title">
            <el-icon><Bell /></el-icon>
            <span>网络流量</span>
          </div>
        </template>
        <div class="network-stats">
          <div class="network-item">
            <div class="network-label">
              上行
            </div>
            <div class="network-value upload">
              {{ systemStats.network_upload || '0 B/s' }}
            </div>
          </div>
          <div class="network-item">
            <div class="network-label">
              下行
            </div>
            <div class="network-value download">
              {{ systemStats.network_download || '0 B/s' }}
            </div>
          </div>
        </div>
      </el-card>

      <!-- System Info -->
      <el-card class="stats-card full-width">
        <template #header>
          <div class="card-title">
            <span>系统信息</span>
          </div>
        </template>
        <div class="system-info-grid">
          <div class="info-grid-item">
            <span class="grid-label">操作系统:</span>
            <span class="grid-value">{{ systemStats.os_name || '-' }}</span>
          </div>
          <div class="info-grid-item">
            <span class="grid-label">系统版本:</span>
            <span class="grid-value">{{ systemStats.os_version || '-' }}</span>
          </div>
          <div class="info-grid-item">
            <span class="grid-label">运行时间:</span>
            <span class="grid-value">{{ systemStats.uptime || '-' }}</span>
          </div>
          <div class="info-grid-item">
            <span class="grid-label">服务器时间:</span>
            <span class="grid-value">{{ systemStats.server_time || '-' }}</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Refresh, Delete, Location, Bell } from '@element-plus/icons-vue'
import { monitorApi } from '@/api/monitorApi'
import { ElMessage } from 'element-plus'

const loading = ref(false)

const systemStats = ref({
  cpu_usage: 0,
  cpu_cores: 0,
  cpu_frequency: '',
  cpu_load: {
    load1: 0,
    load5: 0,
    load15: 0,
    load1_percent: 0,
    load5_percent: 0,
    load15_percent: 0
  },
  memory_usage: 0,
  memory_total: '',
  memory_used: '',
  memory_free: '',
  disk_usage: 0,
  disk_total: '',
  disk_used: '',
  disk_free: '',
  network_upload: '',
  network_download: '',
  os_name: '',
  os_version: '',
  uptime: '',
  server_time: ''
})

let refreshTimer: number | null = null

const getProgressColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const getLoadColor = (percent: number) => {
  if (percent < 60) return '#67c23a'  // 绿色 - 正常
  if (percent < 85) return '#e6a23c'  // 橙色 - 警告
  return '#f56c6c'                     // 红色 - 危险
}

const fetchSystemStats = async () => {
  try {
    loading.value = true
    const data: any = await monitorApi.getSystemStats()
    systemStats.value = {
      cpu_usage: data.cpu_usage || 0,
      cpu_cores: data.cpu_cores || 0,
      cpu_frequency: data.cpu_frequency || '',
      cpu_load: {
        load1: data.cpu_load?.load1 || 0,
        load5: data.cpu_load?.load5 || 0,
        load15: data.cpu_load?.load15 || 0,
        load1_percent: data.cpu_load?.load1_percent || 0,
        load5_percent: data.cpu_load?.load5_percent || 0,
        load15_percent: data.cpu_load?.load15_percent || 0
      },
      memory_usage: data.memory_usage || 0,
      memory_total: formatBytes(data.memory_total) || '',
      memory_used: formatBytes(data.memory_used) || '',
      memory_free: formatBytes(data.memory_free) || '',
      disk_usage: data.disk_usage || 0,
      disk_total: formatBytes(data.disk_total) || '',
      disk_used: formatBytes(data.disk_used) || '',
      disk_free: formatBytes(data.disk_free) || '',
      network_upload: formatSpeed(data.network_upload) || '',
      network_download: formatSpeed(data.network_download) || '',
      os_name: data.os_name || '',
      os_version: data.os_version || '',
      uptime: formatUptime(data.uptime) || '',
      server_time: formatDateTime(data.server_time) || ''
    }
  } catch (error) {
    console.error('获取系统统计信息失败:', error)
  } finally {
    loading.value = false
  }
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
  return `${days}天 ${hours}小时 ${minutes}分钟`
}

const formatDateTime = (timestamp: string | number): string => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

const refreshData = async () => {
  await fetchSystemStats()
  ElMessage.success('数据已刷新')
}

onMounted(() => {
  fetchSystemStats()
  // 每 30 秒自动刷新
  refreshTimer = window.setInterval(() => {
    fetchSystemStats()
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

.system-stats-container {
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

      .stats-detail {
        display: flex;
        align-items: center;
        justify-content: space-around;
        gap: 20px;

        .stats-chart {
          flex-shrink: 0;
        }

        .progress-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-main);
        }

        .stats-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;

          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            background: var(--bg-hover);
            border-radius: 6px;

            .info-label {
              color: var(--text-muted);
              font-size: 14px;
            }

            .info-value {
              color: var(--text-main);
              font-size: 14px;
              font-weight: 500;
            }
          }
        }
      }

      .cpu-load-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border-base);

        .load-item {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          .load-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .load-label {
              color: var(--text-main);
              font-size: 14px;
              font-weight: 500;
            }

            .load-value {
              color: var(--text-secondary);
              font-size: 13px;
            }
          }

          :deep(.el-progress) {
            .el-progress__text {
              font-size: 14px !important;
            }
          }
        }
      }

      .network-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        .network-item {
          padding: 20px;
          background: var(--bg-hover);
          border-radius: $radius-base;
          text-align: center;

          .network-label {
            color: var(--text-muted);
            font-size: 14px;
            margin-bottom: 8px;
          }

          .network-value {
            font-size: 24px;
            font-weight: 600;

            &.upload {
              color: $success;
            }

            &.download {
              color: $primary;
            }
          }
        }
      }

      .system-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;

        .info-grid-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-hover);
          border-radius: $radius-base;

          .grid-label {
            color: var(--text-muted);
            font-size: 14px;
          }

          .grid-value {
            color: var(--text-main);
            font-size: 14px;
            font-weight: 500;
          }
        }
      }
    }
  }
}

@media (max-width: $breakpoint-md) {
  .stats-content {
    grid-template-columns: 1fr !important;
  }

  .stats-detail {
    flex-direction: column;
  }
}
</style>
