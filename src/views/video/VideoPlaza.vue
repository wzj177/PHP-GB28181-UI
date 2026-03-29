<template>
  <div class="video-plaza-container">
    <!-- Search and filters -->
    <div class="search-filters">
      <div class="filters">
        <ElSelect
          v-model="filters.status"
          placeholder="通道状态"
          clearable
          style="width: 150px; margin-right: 10px;"
        >
          <ElOption label="在线" value="online" />
          <ElOption label="离线" value="offline" />
        </ElSelect>

        <ElInput
          v-model="filters.keyword"
          placeholder="请输入通道名称或设备名称"
          style="width: 250px; margin-right: 10px;"
          @keyup.enter="searchVideos"
          clearable
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>

        <ElButton type="primary" @click="searchVideos">搜索</ElButton>
        <ElButton @click="resetFilters">重置</ElButton>
        <ElButton @click="refreshVideos" :loading="loading">刷新</ElButton>
      </div>

      <div class="stats">
        <ElTag>在线: {{ onlineCount }}</ElTag>
        <ElTag type="success">推流中: {{ pushingCount }}</ElTag>
        <ElTag type="info">总计: {{ totalCount }}</ElTag>
      </div>
    </div>

    <!-- Video cards -->
    <div v-loading="loading" class="video-cards">
      <div
        v-for="card in filteredCards"
        :key="card.id"
        class="video-card"
        :class="{ 'card-offline': card.status === 'offline' }"
      >
        <!-- Thumbnail -->
        <div class="card-thumbnail">
          <img v-if="card.thumbnail" :src="card.thumbnail" :alt="card.channel_name" />
          <div v-else class="thumbnail-placeholder">
            <ElIcon :size="48"><VideoCamera /></ElIcon>
          </div>
          <div v-if="card.stream_status === 'pushing'" class="pushing-badge">推流中</div>
          <div v-if="card.status === 'offline'" class="offline-badge">离线</div>
        </div>

        <!-- Info -->
        <div class="card-info">
          <div class="card-title" :title="card.channel_name">{{ card.channel_name }}</div>
          <div class="card-device">{{ card.device_name }}</div>
          <div class="card-meta">
            <ElTag size="small" :type="card.status === 'online' ? 'success' : 'info'">
              {{ card.status === 'online' ? '在线' : '离线' }}
            </ElTag>
            <ElTag v-if="card.stream_status === 'pushing'" size="small" type="success">
              推流中
            </ElTag>
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <ElButton
            size="small"
            type="primary"
            :disabled="card.status === 'offline'"
            @click="playVideo(card)"
          >
            <ElIcon><VideoPlay /></ElIcon>
            播放
          </ElButton>
          <ElButton
            size="small"
            :disabled="card.status === 'offline'"
            @click="startRecord(card)"
          >
            <ElIcon><CircleCheck /></ElIcon>
            录像
          </ElButton>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredCards.length === 0 && !loading" class="empty-state">
        <ElEmpty description="暂无视频数据" />
      </div>
    </div>

    <!-- Video playback dialog -->
    <ElDialog
      v-model="playDialog.visible"
      :title="playDialog.title"
      width="900px"
      top="5vh"
      @close="closePlayDialog"
    >
      <div class="video-player-wrapper">
        <video
          ref="videoRef"
          :src="playDialog.videoUrl"
          controls
          autoplay
          style="width: 100%; height: 500px; background: #000;"
        />
      </div>
      <template #footer>
        <ElButton @click="closePlayDialog">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, VideoCamera, VideoPlay, CircleCheck } from '@element-plus/icons-vue'
import { videoPlazaApi } from '@/api/videoPlazaApi'
import { gb28181Api } from '@/api/gb28181Api'
import type { VideoCard } from '@/types/recording'

// State
const loading = ref(false)
const filters = ref({
  status: '',
  keyword: ''
})
const cards = ref<VideoCard[]>([])

// Play dialog
const playDialog = ref({
  visible: false,
  title: '',
  videoUrl: ''
})

const videoRef = ref<HTMLVideoElement>()

// Refresh timer
let refreshTimer: number | null = null

// Mock data
const mockCards: VideoCard[] = [
  {
    id: '34020000001320000001_34020000001310000001',
    device_id: '34020000001320000001',
    channel_id: '34020000001310000001',
    channel_name: '摄像头1',
    device_name: '大门',
    stream_id: '34020000001320000001_34020000001310000001',
    media_server_id: 'default',
    status: 'online',
    stream_status: 'pushing',
    play_url: 'http://192.168.1.100/app/stream_0.flv',
    thumbnail: ''
  },
  {
    id: '34020000001320000001_34020000001310000002',
    device_id: '34020000001320000001',
    channel_id: '34020000001310000002',
    channel_name: '摄像头2',
    device_name: '大门',
    stream_id: '34020000001320000001_34020000001310000002',
    media_server_id: 'default',
    status: 'online',
    stream_status: 'idle',
    play_url: 'http://192.168.1.100/app/stream_1.flv',
    thumbnail: ''
  },
  {
    id: '34020000001320000002_34020000001310000001',
    device_id: '34020000001320000002',
    channel_id: '34020000001310000001',
    channel_name: '前门摄像头',
    device_name: '一楼大厅',
    stream_id: '34020000001320000002_34020000001310000001',
    media_server_id: 'default',
    status: 'online',
    stream_status: 'pushing',
    play_url: 'http://192.168.1.100/app/stream_2.flv',
    thumbnail: ''
  },
  {
    id: '34020000001320000002_34020000001310000002',
    device_id: '34020000001320000002',
    channel_id: '34020000001310000002',
    channel_name: '后门摄像头',
    device_name: '一楼大厅',
    stream_id: '34020000001320000002_34020000001310000002',
    media_server_id: 'default',
    status: 'offline',
    stream_status: 'idle',
    thumbnail: ''
  },
  {
    id: '34020000001320000003_34020000001310000001',
    device_id: '34020000001320000003',
    channel_id: '34020000001310000001',
    channel_name: '会议室摄像头',
    device_name: '三楼会议室',
    stream_id: '34020000001320000003_34020000001310000001',
    media_server_id: 'default',
    status: 'online',
    stream_status: 'pushing',
    play_url: 'http://192.168.1.100/app/stream_3.flv',
    thumbnail: ''
  },
  {
    id: '34020000001320000003_34020000001310000002',
    device_id: '34020000001320000003',
    channel_id: '34020000001310000002',
    channel_name: '走廊摄像头',
    device_name: '三楼会议室',
    stream_id: '34020000001320000003_34020000001310000002',
    media_server_id: 'default',
    status: 'online',
    stream_status: 'idle',
    play_url: 'http://192.168.1.100/app/stream_4.flv',
    thumbnail: ''
  }
]

// Stats
const onlineCount = computed(() => cards.value.filter(c => c.status === 'online').length)
const pushingCount = computed(() => cards.value.filter(c => c.stream_status === 'pushing').length)
const totalCount = computed(() => cards.value.length)

// Filtered cards
const filteredCards = computed(() => {
  let result = cards.value

  if (filters.value.status) {
    result = result.filter(c => c.status === filters.value.status)
  }

  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    result = result.filter(c =>
      c.channel_name.toLowerCase().includes(keyword) ||
      c.device_name.toLowerCase().includes(keyword)
    )
  }

  return result
})

// Get video cards
const getVideoCards = async () => {
  loading.value = true
  try {
    const params = {
      keyword: filters.value.keyword || undefined,
      status: filters.value.status || undefined
    }

    const response = await videoPlazaApi.getVideoCards(params)

    if (response?.code === 0) {
      cards.value = response.data || []
    } else {
      throw new Error(response?.message || '获取视频列表失败')
    }
  } catch (error: any) {
    console.error('Failed to fetch video cards, using mock data:', error)
    // 使用Mock数据
    cards.value = mockCards
  } finally {
    loading.value = false
  }
}

// Search videos
const searchVideos = () => {
  getVideoCards()
}

// Reset filters
const resetFilters = () => {
  filters.value = {
    status: '',
    keyword: ''
  }
  getVideoCards()
}

// Refresh videos
const refreshVideos = () => {
  getVideoCards()
}

// Play video
const playVideo = async (card: VideoCard) => {
  try {
    if (card.play_url) {
      playDialog.value = {
        visible: true,
        title: card.channel_name,
        videoUrl: card.play_url
      }
    } else {
      // API returns play_urls directly (unwrapped by request.ts interceptor)
      const data = await videoPlazaApi.play({
        device_id: card.device_id,
        channel_id: card.channel_id
      })

      if (data?.play_urls) {
        const urls = data.play_urls
        const firstUrl = urls.hls || urls.http_flv || urls.ws_flv || urls.flv || urls.rtsp || Object.values(urls)[0]

        playDialog.value = {
          visible: true,
          title: card.channel_name,
          videoUrl: firstUrl
        }
      } else {
        throw new Error('启动播放失败')
      }
    }
  } catch (error: any) {
    console.error('Failed to play video:', error)
    ElMessage.error(error.message || '启动播放失败')
  }
}

// Start recording
const startRecord = async (card: VideoCard) => {
  try {
    const response = await gb28181Api.startRecord({
      device_id: card.device_id,
      channel_id: card.channel_id
    })

    if (response?.code === 0) {
      ElMessage.success('录像已开始')
    } else {
      throw new Error(response?.message || '开始录像失败')
    }
  } catch (error: any) {
    console.error('Failed to start recording:', error)
    ElMessage.error(error.message || '开始录像失败')
  }
}

// Close play dialog
const closePlayDialog = () => {
  playDialog.value.visible = false
  playDialog.value.videoUrl = ''

  if (videoRef.value) {
    videoRef.value.pause()
  }
}

// Initialize
onMounted(() => {
  getVideoCards()
  // Auto refresh every 30 seconds
  refreshTimer = window.setInterval(() => {
    getVideoCards()
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

.video-plaza-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .search-filters {
    background: var(--bg-panel);
    padding: 20px;
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    .filters {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stats {
      display: flex;
      gap: 8px;
    }
  }

  .video-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    min-height: 400px;

    .video-card {
      background: var(--bg-panel);
      border-radius: $radius-panel;
      border: 1px solid var(--border-base);
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      &.card-offline {
        opacity: 0.6;
      }
    }

    .card-thumbnail {
      position: relative;
      width: 100%;
      height: 160px;
      background: var(--bg-active);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .thumbnail-placeholder {
        color: var(--text-placeholder);
      }

      .pushing-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        padding: 2px 8px;
        background: rgba(103, 194, 58, 0.9);
        color: white;
        font-size: 12px;
        border-radius: 4px;
      }

      .offline-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        padding: 2px 8px;
        background: rgba(144, 147, 153, 0.9);
        color: white;
        font-size: 12px;
        border-radius: 4px;
      }
    }

    .card-info {
      padding: 12px;

      .card-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-main);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-device {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .card-meta {
        display: flex;
        gap: 4px;
      }
    }

    .card-actions {
      padding: 0 12px 12px;
      display: flex;
      gap: 8px;
    }
  }

  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 20px;
  }

  .video-player-wrapper {
    width: 100%;
  }
}
</style>
